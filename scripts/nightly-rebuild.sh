#!/usr/bin/env bash
# Nightly static rebuild of learningpack, so JSON-LD prices/availability and sitemap.xml are never >24h stale.
# Stages a build with deploy-static.sh, sanity-checks it against what is live, and only then swaps.
# Any failure leaves the live site untouched (deploy-static.sh only swaps on success).
#
# Install: copy this file to ~devops/deploy-scripts/learningpack-nightly.sh (outside every git checkout, so it never
# blocks a pull). Needs backend >= 25c6b61 on the server so deploy-static.sh prunes to KEEP=5, and Node 20+ on cron's
# PATH (or NODE_BIN=...). REF must be the branch that is LIVE: feat/seo until it is merged, then main (a wrong REF
# would deploy older code).
#
# Crontab (devops), after the 02:30 backup and 03:15 lockout purge:
#   10 4 * * * KEEP=5 REF=feat/seo $HOME/deploy-scripts/learningpack-nightly.sh >> $HOME/home/personal/personalweb/logs/learningpack-nightly.log 2>&1
set -Eeuo pipefail

REF="${REF:-main}"                                   # branch that is live
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

LOG="$(mktemp)"; trap 'rm -f "$LOG"' EXIT
say "stage $REF"
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
