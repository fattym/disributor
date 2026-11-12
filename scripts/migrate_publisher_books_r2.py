import json, os, re, sys, unicodedata, mimetypes
from urllib.parse import urlparse, quote
from urllib.request import urlopen, Request
from collections import defaultdict
import boto3
from botocore.config import Config

CDN_BASE = 'https://image.codingclubskenya.com'
BUCKET = 'learningpackbooks'
ACCOUNT_ID = 'c784ad89fd4c270a50b5c5bb326138ac'
ENDPOINT = f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com'
ACCESS_KEY = 'be06f1637e66d0763ca868236c3c5b23'
SECRET_KEY = '74d45937f7538ec15766da55561282626babd8a228528f5f33782a365f1cb4b4'
INCREMENT = 70

def slugify(text):
    text = unicodedata.normalize('NFKD', text or '')
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text or 'book'

def parse_amount(s):
    if s is None: return 0
    digits = re.sub(r'[^0-9.]', '', str(s))
    if not digits: return 0
    # take integer part
    if '.' in digits:
        digits = digits.split('.')[0]
    return int(digits) if digits else 0

def format_amount_like(old, new_n):
    s = str(old)
    # KSH275.00 or KSh 1,102 etc.
    if s.strip().upper().startswith('KSH') and '\u00a0' not in s and ' ' not in s.replace('KSH','',1)[:1]:
        # like KSH275.00
        if '.' in s:
            return f"KSH{new_n}.00"
        return f"KSH{new_n}"
    # fallback to KSh NBSP comma style
    return f"KSh\u00a0{new_n:,}"

def update_whatsapp_href(href, old_amount_str, new_amount_str):
    if not isinstance(href, str): return href
    old_n = parse_amount(old_amount_str)
    new_n = parse_amount(new_amount_str)
    # encoded full strings
    for o,n in [(old_amount_str,new_amount_str)]:
        try:
            enc_o = quote(str(o), safe='')
            enc_n = quote(str(n), safe='')
            if enc_o and enc_o in href: href = href.replace(enc_o, enc_n)
        except: pass
    # common forms
    variants = [
        (f"KSh {old_n:,}", f"KSh {new_n:,}"),
        (f"KSH{old_n}.00", f"KSH{new_n}.00"),
        (f"KSH{old_n}", f"KSH{new_n}"),
        (f"KSh\u00a0{old_n:,}", f"KSh\u00a0{new_n:,}"),
        (f"{old_n:,}", f"{new_n:,}"),
        (str(old_n), str(new_n)),
    ]
    for o,n in variants:
        enc_o = quote(o, safe='')
        enc_n = quote(n, safe='')
        if enc_o in href: href = href.replace(enc_o, enc_n)
        if o in href: href = href.replace(o, n)
    return href

def process_file(path, s3, existing):
    with open(path) as f:
        data = json.load(f)
    if not isinstance(data, list):
        print(f"skip {path}: not a list"); return
    # schema detect
    sample = data[0] if data else {}
    if 'image src' in sample and 'title' in sample:
        img_key = 'image src'
        title_key = 'title'
        price_key = 'price'
    elif 'attachment-woocommerce_thumbnail src' in sample:
        img_key = 'attachment-woocommerce_thumbnail src'
        title_key = 'woocommerce-LoopProduct-link'
        price_key = 'woocommerce-Price-amount'
    else:
        print(f"unknown schema {path} keys={list(sample.keys())}"); return

    totals = defaultdict(int)
    for item in data:
        totals[slugify(item.get(title_key,'') or 'book')] += 1
    seen = defaultdict(int)
    assigned = []
    for item in data:
        base = slugify(item.get(title_key,'') or 'book')
        seen[base] += 1
        final_base = base if totals[base]==1 or seen[base]==1 else f"{base}-{seen[base]}"
        src = item.get(img_key,'') or ''
        ext = os.path.splitext(urlparse(src).path)[1].lower() or '.jpg'
        if len(ext)>5 or '/' in ext: ext='.jpg'
        assigned.append((final_base + ext, src))

    cache = {}
    uploaded = skipped = 0
    for key, src in assigned:
        if not src:
            cache[src] = None; skipped += 1; continue
        if src in cache: continue
        if key in existing:
            cache[src] = key; skipped += 1; continue
        try:
            req = Request(src, headers={'User-Agent': 'Mozilla/5.0'})
            with urlopen(req, timeout=30) as resp:
                body = resp.read()
                ctype = resp.headers.get('Content-Type', '').split(';')[0].strip() or mimetypes.guess_type(key)[0] or 'image/jpeg'
            s3.put_object(Bucket=BUCKET, Key=key, Body=body, ContentType=ctype)
            cache[src] = key; existing.add(key); uploaded += 1
        except Exception as e:
            print(f'WARN {path} upload failed for {src}: {e}', flush=True)
            cache[src] = None
        if (uploaded+skipped) % 50 == 0 and (uploaded+skipped)>0:
            print(f'{path} progress {uploaded+skipped} up={uploaded} skip={skipped}', flush=True)
    print(f'{path} done uploaded={uploaded} skipped={skipped}', flush=True)

    for item,(key,src) in zip(data,assigned):
        if src and cache.get(src) is not None:
            item[img_key] = f"{CDN_BASE}/{key}"
        elif not src:
            pass
        else:
            item[img_key] = f"{CDN_BASE}/{key}"
        if price_key in item and item[price_key] is not None:
            old_amt = item[price_key]
            old_n = parse_amount(old_amt)
            new_n = old_n + INCREMENT
            new_amt = format_amount_like(old_amt, new_n)
            item[price_key] = new_amt
            # update any whatsapp/button href-like fields
            for k,v in list(item.items()):
                if isinstance(v,str) and ('wa.me' in v or 'whatsapp' in v or k.lower().endswith('href') and 'send' in v):
                    item[k] = update_whatsapp_href(v, old_amt, new_amt)
    with open(path,'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2); f.write('\n')
    print(f'{path} updated {len(data)}', flush=True)

def main():
    files = sys.argv[1:] or ['oxford.json','storymoja.json','klb.json','spotlight.json']
    s3 = boto3.client('s3', endpoint_url=ENDPOINT, aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY, region_name='auto', config=Config(signature_version='s3v4'))
    existing = set()
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET):
        for obj in page.get('Contents', []): existing.add(obj['Key'])
    print(f'existing in bucket: {len(existing)}', flush=True)
    for p in files:
        if os.path.exists(p): process_file(p, s3, existing)
        else: print(f'missing {p}', flush=True)

if __name__=='__main__':
    main()
