# Film catalogue

The archive contains the original 25 films plus 500 new works selected for their
sense of place, everyday life, cultural context, or historical setting. The new
selection spans East/South/Southeast Asia, the Middle East, Europe, Africa, the
Americas, Australia, New Zealand, Samoa, and Vanuatu. It includes fiction,
animation, and documentary; it is not a list of historically verified accounts.

## Editorial sources and maintenance

- `src/data/world-cinema/selection.psv`: 500 individually selected films, Korean
  titles, story regions, setting periods, and original Korean viewing notes.
- `places.psv`: representative coordinates, geographic labels, and precision.
  These are browsing anchors, not geocoded scenes or exact filming locations.
  Fictional/unspecified places use broad regions; explicit inspiration markers
  (e.g. Women Talking, Incendies, The Grand Budapest Hotel) are labeled separately.
- `metadata.json`: source-backed director, release year, canonical film page,
  and available poster provenance, checked 2026-09-20. Release refers to the
  source's first release, not necessarily the Korean theatrical release.
- `catalogue.json`: generated application records. Regenerate offline with
  `node scripts/build-world-cinema.mjs`, then format the generated JSON.
- `scripts/import-world-cinema.py`: explicit, cached metadata enrichment from
  each selected public film page. Rejects non-film/disambiguation pages. It does
  not infer story locations from production countries or shooting locations.
  Its ignored `.local/world-cinema` cache also holds bounded plot excerpts for
  editorial review. The build never needs network access or third-party API keys.

Selection references included the [BFI Sight and Sound list](https://www.bfi.org.uk/sight-and-sound/greatest-films-all-time)
and [Criterion World Cinema Project](https://www.criterion.com/boxsets/1021-martin-scorsese-s-world-cinema-project).
Each new film links to its own checked information page; viewing notes are
original editorial text, not copied synopses. Historical interpretation and
exact fictional geography can be refined through later editorial review.

121 of the added works have locally stored promotional posters with provenance
in `public/posters/sources.json`. Poster copyright remains with the rights holders.
The image host rate-limited the remaining requests; those 379 films intentionally
use typographic HAS title cards, not unrelated images or invented posters.

## Browsing and integrity

Search always covers the full catalogue. The list presents 40 works per page;
filters reset the page, and map selection reveals the selected film's page.
The globe groups common locations, then clusters nearby places at wide zoom.
Every cluster keeps the actual location associated with each film so selecting
one never substitutes the cluster anchor for that film's story setting.
Zooming separates nearby groups. A world-scale marker may span countries and
is labeled with the number of additional places rather than implying all films
are set in the anchor city.

Tests check the exact 500 additions/525 total, duplicate film identities and
source URLs, required fields, coordinates shared with the original catalogue,
poster provenance, complete cluster membership and location mapping, pagination,
search reset, era filtering, and database registry parity.

The `expand_world_cinema_500` migration adds film IDs idempotently to the existing
community registry. It does not alter accounts, verification, comment policies,
or existing comments. Public email/identity readiness flags remain gated pending
the separate authentication setup work.
