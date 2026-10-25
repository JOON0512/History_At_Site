"""Fetch the public article's declared poster; keep provenance for this local prototype."""
import html
import json
import re
import argparse
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILMS = {
    'about-time': 'About_Time_(2013_film)', 'taxi-driver': 'A_Taxi_Driver',
    'red-cliff': 'Red_Cliff_(film)', 'troy': 'Troy_(film)',
    'pearl-harbor': 'Pearl_Harbor_(film)', 'taegukgi': 'Taegukgi_(film)',
    'pianist': 'The_Pianist_(2002_film)', 'odyssey': 'The_Odyssey_(2026_film)',
    'in-the-mood-for-love': 'In_the_Mood_for_Love', 'chungking-express': 'Chungking_Express',
    'perfect-days': 'Perfect_Days', 'cinema-paradiso': 'Cinema_Paradiso',
    'amelie': 'Amélie', 'before-sunrise': 'Before_Sunrise',
    'roma': 'Roma_(2018_film)', 'city-of-god': 'City_of_God_(2002_film)',
    'motorcycle-diaries': 'The_Motorcycle_Diaries_(film)', 'out-of-africa': 'Out_of_Africa_(film)',
    'a-separation': 'A_Separation', 'slumdog-millionaire': 'Slumdog_Millionaire',
    'rabbit-proof-fence': 'Rabbit-Proof_Fence', 'the-piano': 'The_Piano',
    'gladiator': 'Gladiator_(2000_film)', 'timbuktu': 'Timbuktu_(2014_film)',
    'the-last-emperor': 'The_Last_Emperor',
}

def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'HAS-local-prototype/0.1'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()

def download(item):
    film_id, title = item
    page = 'https://en.wikipedia.org/wiki/' + urllib.parse.quote(title)
    markup = get(page).decode('utf-8')
    match = re.search(r'<meta property="og:image" content="([^"]+)"', markup)
    if not match:
        raise RuntimeError('No declared poster for ' + film_id)
    url = html.unescape(match.group(1)).split('?')[0]
    target = ROOT / 'public' / 'posters' / (film_id + ('.png' if url.lower().endswith('.png') else '.jpg'))
    if not target.exists():
        content = get(url)
        target.write_bytes(content)
    print(film_id, target.stat().st_size, flush=True)
    return {'film': film_id, 'article': page, 'image': url, 'local': '/posters/' + target.name,
            'rights': 'Promotional film poster. Copyright remains with the respective rights holder; not an open-license asset.'}

if __name__ == '__main__':
    (ROOT / 'public' / 'posters').mkdir(exist_ok=True)
    parser = argparse.ArgumentParser()
    parser.add_argument('ids', nargs='*', choices=list(FILMS))
    args = parser.parse_args()
    manifest = ROOT / 'public' / 'posters' / 'sources.json'
    records = {r['film']: r for r in json.loads(manifest.read_text())} if manifest.exists() else {}
    for film_id in args.ids or FILMS:
        existing = records.get(film_id)
        if existing and (ROOT / 'public' / existing['local'].lstrip('/')).is_file():
            continue
        try:
            records[film_id] = download((film_id, FILMS[film_id]))
        except Exception as error:
            print(film_id, str(error), flush=True)
        manifest.write_text(json.dumps(list(records.values()), indent=2), encoding='utf-8')
