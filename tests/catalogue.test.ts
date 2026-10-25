import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { films, filterFilms, eras } from "../src/data/films";
import { clusterPlaces, groupFilmsByPlace } from "../src/lib/places";

describe("growing film catalogue", () => {
  it("keeps distinct films at one location accessible through one map group", () => {
    const hongKong = groupFilmsByPlace(films).find(
      (group) => group.place.id === "hong-kong",
    );
    expect(hongKong?.films.map((film) => film.id)).toEqual(
      expect.arrayContaining([
        "in-the-mood-for-love",
        "chungking-express",
        "atlas-days-of-being-wild",
      ]),
    );
    expect(
      groupFilmsByPlace(filterFilms("화양연화", "all")).find(
        (group) => group.place.id === "hong-kong",
      )?.films,
    ).toHaveLength(1);
    expect(groupFilmsByPlace(filterFilms("없는영화", "all"))).toEqual([]);
  });
  it("finds the story setting independently of release year and matches both centuries", () => {
    expect(filterFilms("피아노", "nineteenth").map((film) => film.id)).toEqual([
      "the-piano",
    ]);
    expect(filterFilms("로마", "twentieth").map((film) => film.id)).toEqual(
      expect.arrayContaining(["roma", "atlas-bicycle-thieves"]),
    );
    expect(filterFilms("로마", "ancient").map((film) => film.id)).toEqual([
      "gladiator",
    ]);
    for (const era of ["twentieth", "contemporary"] as const) {
      expect(filterFilms("슬럼독", era).map((film) => film.id)).toEqual([
        "slumdog-millionaire",
      ]);
    }
    expect(filterFilms("페루", "all").map((film) => film.id)).toEqual(
      expect.arrayContaining([
        "motorcycle-diaries",
        "atlas-the-milk-of-sorrow",
      ]),
    );
  });
  it("adds exactly 500 distinct works with complete searchable editorial records", () => {
    expect(films).toHaveLength(525);
    const added = films.filter((f) => f.id.startsWith("atlas-"));
    expect(added).toHaveLength(500);
    expect(new Set(added.map((f) => f.sources[0].url)).size).toBe(500);
    expect(
      new Set(films.map((f) => `${f.originalTitle.toLowerCase()}|${f.release}`))
        .size,
    ).toBe(525);
    for (const film of added) {
      expect(film.release).toMatch(/^(18|19|20)\d{2}$/);
      expect(film.director.length).toBeGreaterThan(2);
      expect(film.experience.length).toBeGreaterThan(25);
      expect(film.title + film.experience).not.toMatch(
        /검토용|TODO|placeholder/,
      );
      expect(eras.some((e) => e.id === film.era)).toBe(true);
      expect(filterFilms(film.originalTitle, "all")).toContain(film);
    }
    expect(filterFilms("탄나", "all").map((f) => f.id)).toContain(
      "atlas-tanna-film",
    );
    expect(filterFilms("와즈다", "contemporary")).toHaveLength(1);
    expect(filterFilms("라쇼몽", "medieval")).toHaveLength(1);
    expect(filterFilms("자산어보", "nineteenth")).toHaveLength(1);
  });
  it("declutters the globe without dropping films or assigning a cluster's anchor to another film", () => {
    const groups = groupFilmsByPlace(films);
    const clusters = clusterPlaces(groups, 8, "london");
    expect(clusters.length).toBeLessThan(groups.length / 2);
    expect(clusters[0].place.id).toBe("london");
    expect(
      new Set(clusters.flatMap((c) => c.places.map((p) => p.id))).size,
    ).toBe(groups.length);
    expect(
      new Set(clusters.flatMap((c) => c.films.map((f) => f.id))).size,
    ).toBe(525);
    for (const cluster of clusters) {
      expect(new Set(cluster.films.map((f) => f.id)).size).toBe(
        cluster.films.length,
      );
      for (const film of cluster.films) {
        const place = cluster.filmPlaces.get(film.id);
        expect(film.places.map((p) => p.id)).toContain(place?.id);
        expect(cluster.places.map((p) => p.id)).toContain(place?.id);
      }
    }
    expect(clusterPlaces(groups, 1.5).length).toBeGreaterThan(clusters.length);
  });
  it("has unique IDs, valid consistent map locations, sources, and local posters with provenance", () => {
    const manifest = JSON.parse(
      readFileSync(
        new URL("../public/posters/sources.json", import.meta.url),
        "utf8",
      ),
    ) as { film: string; local: string }[];
    expect(new Set(films.map((film) => film.id)).size).toBe(films.length);
    const locations = new Map();
    for (const film of films) {
      expect(film.sources.length, film.id).toBeGreaterThan(0);
      expect(film.places.length, film.id).toBeGreaterThan(0);
      if (!film.id.startsWith("atlas-"))
        expect(film.poster, film.id).toBeTruthy();
      if (film.poster) {
        expect(
          existsSync(new URL("../public" + film.poster, import.meta.url)),
          film.id,
        ).toBe(true);
        expect(
          manifest.find((source) => source.film === film.id)?.local,
          film.id,
        ).toBe(film.poster);
      }
      for (const place of film.places) {
        expect(Math.abs(place.lat), place.id).toBeLessThanOrEqual(90);
        expect(Math.abs(place.lng), place.id).toBeLessThanOrEqual(180);
        const coordinates = [place.lat, place.lng, place.country];
        if (locations.has(place.id))
          expect(coordinates).toEqual(locations.get(place.id));
        locations.set(place.id, coordinates);
      }
    }
  });
});
