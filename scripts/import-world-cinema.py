"""Enrich the hand-curated selection with cited public film facts and poster provenance.

Network work is explicit, cached, bounded, and never runs in the browser or build.
Run again to resume after adding selection rows. Editorial settings are not inferred
from production countries or filming locations.
"""
import concurrent.futures
import html
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data/world-cinema'
CACHE = ROOT / '.local/world-cinema'
CACHE.mkdir(parents=True, exist_ok=True)
HEADERS = {'User-Agent': 'HAS-local-prototype/0.1'}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=35) as r:
        return r.read()


def plain(s):
    s = re.sub(r'<(?:style|script)\b[^>]*>.*?</(?:style|script)>', '', s, flags=re.S)
    s = re.sub(r'<sup\b[^>]*>.*?</sup>', '', s, flags=re.S)
    s = re.sub(r'</li>|<br\s*/?>', '; ', s)
    s = html.unescape(re.sub('<[^>]+>', ' ', s))
    return re.sub(r'\s+', ' ', s).strip(' ;')


def field(markup, label):
    for th, td in re.findall(r'<th\b[^>]*>(.*?)</th>\s*<td\b[^>]*>(.*?)</td>', markup, re.S):
        if label in plain(th).lower():
            return td
    return ''


def enrich(row):
    slug = row[0]
    safe = re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', slug).encode('ascii', 'ignore').decode().lower()).strip('-')
    film_id = 'atlas-' + safe
    cached = CACHE / (safe + '.json')
    if cached.exists():
        return json.loads(cached.read_text())
    url = 'https://en.wikipedia.org/wiki/' + urllib.parse.quote(slug)
    try:
        markup = get(url).decode('utf-8')
        title_match = re.search(r'<meta property="og:title" content="([^"]+)"', markup)
        article_title = html.unescape(title_match.group(1)).removesuffix(' - Wikipedia') if title_match else slug.replace('_', ' ')
        director = plain(field(markup, 'directed by'))
        release = field(markup, 'release date')
        year_match = re.search(r'\b(18\d{2}|19\d{2}|20\d{2})\b', plain(release))
        if not director or not year_match:
            raise ValueError('Missing film director/release; check article identity: ' + article_title)
        canonical = re.search(r'<link rel="canonical" href="([^"]+)"', markup)
        canonical_url = html.unescape(canonical.group(1)) if canonical else url
        title = re.sub(r' \((?:\d{4} )?(?:(?:American|Japanese|Indian|French|British|South Korean|Italian|Australian|Hong Kong|Chinese|Taiwanese|animated|Mexican) )?film\)$', '', article_title)
        result = {'id': film_id, 'slug': slug, 'originalTitle': title, 'director': director,
                  'release': year_match.group(1), 'url': canonical_url, 'checkedAt': '2026-09-20'}
        # Image collection is deliberately separate. Existing cached, checked posters
        # remain attached; source hosts declined the remaining batch. The application
        # uses editorial title cards for records without artwork.
        # Cache a bounded plot excerpt for editorial setting review, never ship it as copy.
        plot = re.search(r'id="(?:Plot|Synopsis)"', markup)
        evidence = plain(markup[plot.start():plot.start()+18000])[:7000] if plot else ''
        (CACHE / (safe + '.evidence.txt')).write_text(article_title + '\n' + evidence)
        cached.write_text(json.dumps(result, ensure_ascii=False, indent=2))
        return result
    except Exception as error:
        return {'slug': slug, 'error': str(error)}


def main():
    rows = [s.split('|') for s in (DATA / 'selection.psv').read_text().splitlines() if s and not s.startswith('#')]
    if any(len(row) != 6 for row in rows):
        raise ValueError('Expected exactly six editorial columns')
    if len({row[0] for row in rows}) != len(rows):
        raise ValueError('Duplicate selection article')
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(enrich, rows):
            results.append(result)
            if 'error' in result or len(results) % 25 == 0:
                print(json.dumps({'done':len(results), 'total':len(rows), **({'slug':result['slug'],'error':result['error']} if 'error' in result else {})}, ensure_ascii=False), flush=True)
    successes = [r for r in results if 'error' not in r]
    (DATA / 'metadata.json').write_text(json.dumps(successes, ensure_ascii=False, indent=2) + '\n')
    (CACHE / 'failures.json').write_text(json.dumps([r for r in results if 'error' in r], ensure_ascii=False, indent=2))
    manifest_file = ROOT / 'public/posters/sources.json'
    manifest = {r['film']:r for r in json.loads(manifest_file.read_text())}
    for r in successes:
        if r.get('poster'):
            manifest[r['id']] = {'film':r['id'],'article':r['url'],'image':r['image'],'local':r['poster'],
                'rights':'Promotional film poster. Copyright remains with the respective rights holder; not an open-license asset.'}
    manifest_file.write_text(json.dumps(list(manifest.values()), ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'selected':len(rows),'enriched':len(successes),'posters':sum(bool(r.get('poster')) for r in successes),'errors':len(results)-len(successes)}), flush=True)

if __name__ == '__main__':
    main()
