# Nightly static rebuild of learningpack, so JSON-LD prices/availability and sitemap.xml are never >24h stale.
# It rebuilds the EXACT COMMIT the live release was built from (read from the live release's own git worktree),
# never a branch name, so it can only refresh data, never deploy different code. New code goes out through a normal
# deploy-static.sh run. Stages a build, sanity-checks it against what is live, and only then swaps. Any failure
# leaves the live site untouched.
#
# Install: copy to ~devops/deploy-scripts/learningpack-nightly.sh (outside every git checkout, so it never blocks a
# pull). Do NOT install the cron until backend >= 25c6b61 is deployed on the server (deploy-static.sh then prunes to
# KEEP=5; the older script keeps 3). Node 20+ must be on cron's PATH (or set NODE_BIN=...).
#
# Crontab (devops), after the 02:30 backup and 03:15 lockout purge:
#   10 4 * * * KEEP=5 $HOME/deploy-scripts/learningpack-nightly.sh >> $HOME/home/personal/personalweb/logs/learningpack-nightly.log 2>&1
set -Eeuo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/home/devops/home/personal/personalweb}"
DEPLOY="${DEPLOY:-$PROJECT_ROOT/epk/deploy/deploy-static.sh}"
LIVE="${LIVE:-$PROJECT_ROOT/disributor/out}"
MIN_RATIO_PCT="${MIN_RATIO_PCT:-90}"                 # refuse a build with fewer product pages than this % of live
export KEEP="${KEEP:-5}"                             # deploy-static.sh keeps this many releases per site, older ones are deleted
export NODE_BIN="${NODE_BIN:-}"                      # dir containing node 20+, if not on PATH

say() { printf '%s %s\n' "$(date -Is)" "$*"; }
die() { say "ABORT: $*"; exit 1; }

exec 9>/tmp/learningpack-nightly.lock
flock -n 9 || { say "previous run still going, skipping"; exit 0; }

# The live release is a git worktree: its HEAD is the commit it was built from.
LIVE_OUT="$(readlink -f "$LIVE")"; LIVE_REL="$(dirname "$LIVE_OUT")"
REF="$(git -C "$LIVE_REL" rev-parse --verify HEAD 2>/dev/null)" || die "cannot read the live release commit from $LIVE_REL"
[ "${#REF}" -eq 40 ] || die "bad live commit '$REF'"
LOG="$(mktemp)"; trap 'rm -f "$LOG"' EXIT
say "live release $LIVE_REL is commit $REF; rebuilding that exact commit"
STAGE_ONLY=1 "$DEPLOY" distributor "$REF" 2>&1 | tee "$LOG"
REL="$(sed -n 's/^STAGED (not live): //p' "$LOG" | tail -1)"
[ -n "$REL" ] && [ -d "$REL/out" ] || die "no staged build found"

count() { find "$1/shop" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l; }
NEW_N="$(count "$REL/out")"; OLD_N="$(count "$LIVE")"
say "product dirs: new=$NEW_N live=$OLD_N"
[ "$NEW_N" -ge $(( OLD_N * MIN_RATIO_PCT / 100 )) ] || die "new build has too few product pages (API outage during build?)"
for f in robots.txt sitemap.xml; do [ -s "$REL/out/$f" ] || die "missing $f"; done
grep -q 'application/ld+json' "$REL/out/shop/$(ls "$REL/out/shop" | grep -m1 '^[0-9]')/index.html" || die "product page has no JSON-LD"

say "swap"
USE_RELEASE="$REL" "$DEPLOY" distributor "$REF"
say "done"
