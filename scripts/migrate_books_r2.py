import json, os, re, unicodedata, mimetypes
from urllib.parse import urlparse, quote, unquote
from urllib.request import urlopen, Request
from collections import defaultdict
import boto3
from botocore.config import Config

BOOKS_PATH = 'books.json'
CDN_BASE = 'https://image.codingclubskenya.com'
BUCKET = 'learningpackbooks'
ACCOUNT_ID = 'c784ad89fd4c270a50b5c5bb326138ac'
ENDPOINT = f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com'
ACCESS_KEY = 'be06f1637e66d0763ca868236c3c5b23'
SECRET_KEY = '74d45937f7538ec15766da55561282626babd8a228528f5f33782a365f1cb4b4'
INCREMENT = 70

def slugify(text):
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text or 'book'

def format_amount(n):
    # original like "KSh 1,102" (non-breaking space)
    return f"KSh\u00a0{n:,}"

def parse_amount(s):
    # s like "KSh 1,102" or "KSh 1,102"
    digits = re.sub(r'[^0-9]', '', s)
    return int(digits) if digits else 0

def update_whatsapp_href(href, old_amount_str, new_amount_str):
    # replace in decoded-ish forms present in URL encoding
    # examples: KSh%201%2C102 and maybe KSh%20...
    old_n = parse_amount(old_amount_str)
    new_n = parse_amount(new_amount_str)
    # try replacing encoded representations
    old_enc1 = quote(old_amount_str, safe='')  # KSh%C2%A01%2C102
    new_enc1 = quote(new_amount_str, safe='')
    if old_enc1 in href:
        href = href.replace(old_enc1, new_enc1)
    # also replace plain number patterns KSh%201%2C102 (space as %20)
    old_plain = f"KSh {old_n:,}"
    new_plain = f"KSh {new_n:,}"
    old_enc2 = quote(old_plain, safe='')
    new_enc2 = quote(new_plain, safe='')
    if old_enc2 in href:
        href = href.replace(old_enc2, new_enc2)
    # fallback: replace the numeric part with commas in encoded form
    old_num = f"{old_n:,}"
    new_num = f"{new_n:,}"
    href = href.replace(quote(old_num, safe=''), quote(new_num, safe=''))
    href = href.replace(old_num, new_num)
    return href

def main():
    with open(BOOKS_PATH) as f:
        data = json.load(f)

    s3 = boto3.client('s3',
        endpoint_url=ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name='auto',
        config=Config(signature_version='s3v4'))

    # precompute slugs with -2,-3 for dup titles
    slug_counts = defaultdict(int)
    assigned = []  # (slug_with_ext, ext, content_type_source)
    for item in data:
        title = item.get('woocommerce-LoopProduct-link', '') or 'book'
        base = slugify(title)
        slug_counts[base] += 1
        n = slug_counts[base]
        final_base = base if n == 1 else f"{base}-{n}"
        src = item.get('attachment-woocommerce_thumbnail src', '')
        path = urlparse(src).path
        ext = os.path.splitext(path)[1].lower() or '.jpg'
        assigned.append((final_base + ext, ext, src))

    # detect if any base had dup so first stays without suffix? yes
    # but logic above gave -2 to second; first got base (count 1) - correct except we need to know if dups exist: doesn't matter, first keeps base.
    # actually easier: count totals first
    totals = defaultdict(int)
    for item in data:
        totals[slugify(item.get('woocommerce-LoopProduct-link','') or 'book')] += 1
    seen = defaultdict(int)
    assigned = []
    for item in data:
        base = slugify(item.get('woocommerce-LoopProduct-link','') or 'book')
        seen[base] += 1
        if totals[base] == 1:
            final_base = base
        else:
            final_base = base if seen[base] == 1 else f"{base}-{seen[base]}"
        src = item.get('attachment-woocommerce_thumbnail src', '')
        path = urlparse(src).path
        ext = os.path.splitext(path)[1].lower() or '.jpg'
        assigned.append((final_base + ext, src))

    cache = {}  # src url -> key uploaded
    uploaded = 0
    skipped = 0
    # build set of existing keys for resume
    existing = set()
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET):
        for obj in page.get('Contents', []):
            existing.add(obj['Key'])
    print(f'existing in bucket: {len(existing)}', flush=True)
    for i, (key, src) in enumerate(assigned):
        if not src:
            cache[src] = None
            skipped += 1
            continue
        if src in cache:
            continue
        if key in existing:
            cache[src] = key
            skipped += 1
            continue
        try:
            req = Request(src, headers={'User-Agent': 'Mozilla/5.0'})
            with urlopen(req, timeout=30) as resp:
                body = resp.read()
                ctype = resp.headers.get('Content-Type', '').split(';')[0].strip() or mimetypes.guess_type(key)[0] or 'image/jpeg'
            s3.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType=ctype)
            cache[src] = key
            existing.add(key)
            uploaded += 1
        except Exception as e:
            print(f'WARN upload failed for {src}: {e}', flush=True)
            cache[src] = None
        if (uploaded + skipped) % 50 == 0:
            print(f'progress {uploaded+skipped} uploaded={uploaded} skipped={skipped}', flush=True)
    print(f'total uploaded {uploaded} skipped {skipped}', flush=True)

    # transform
    for item, (key, src) in zip(data, assigned):
        if src and cache.get(src) is not None:
            item['attachment-woocommerce_thumbnail src'] = f"{CDN_BASE}/{key}"
        elif not src:
            # leave empty
            pass
        else:
            # failed upload - still point to intended CDN key? or keep original; point to cdn key name
            item['attachment-woocommerce_thumbnail src'] = f"{CDN_BASE}/{key}"
        old_amt = item.get('woocommerce-Price-amount','')
        old_n = parse_amount(old_amt)
        new_n = old_n + INCREMENT
        new_amt = format_amount(new_n)
        item['woocommerce-Price-amount'] = new_amt
        if 'button href' in item:
            item['button href'] = update_whatsapp_href(item['button href'], old_amt, new_amt)
        # also update primary href/cart links not containing price; leave as-is

    with open(BOOKS_PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('books.json updated', len(data), flush=True)

if __name__ == '__main__':
    main()
