import type { Film, Place } from "../data/films";

export type PlaceGroup = { place: Place; films: Film[] };

export function groupFilmsByPlace(films: Film[]): PlaceGroup[] {
  const groups = new Map<string, PlaceGroup>();
  for (const film of films) {
    for (const place of film.places) {
      const group = groups.get(place.id);
      if (group) {
        if (!group.films.some((existing) => existing.id === film.id))
          group.films.push(film);
      } else groups.set(place.id, { place, films: [film] });
    }
  }
  return [...groups.values()];
}

export type PlaceCluster = PlaceGroup & {
  places: Place[];
  filmPlaces: Map<string, Place>;
};

// Preserve each film's actual location when grouping nearby markers.
// The spherical distance also handles the international date line.
export function clusterPlaces(
  groups: PlaceGroup[],
  radius: number,
  activePlace?: string,
): PlaceCluster[] {
  const radians = Math.PI / 180;
  const clusters: PlaceCluster[] = [];
  const ordered = [...groups].sort(
    (a, b) =>
      Number(b.place.id === activePlace) - Number(a.place.id === activePlace) ||
      b.films.length - a.films.length,
  );
  for (const group of ordered) {
    const cluster = clusters.find(({ place }) => {
      const a =
        Math.sin(((place.lat - group.place.lat) * radians) / 2) ** 2 +
        Math.cos(place.lat * radians) *
          Math.cos(group.place.lat * radians) *
          Math.sin(((place.lng - group.place.lng) * radians) / 2) ** 2;
      return (2 * Math.asin(Math.sqrt(Math.min(1, a)))) / radians <= radius;
    });
    if (cluster) {
      cluster.places.push(group.place);
      for (const film of group.films) {
        if (!cluster.filmPlaces.has(film.id)) {
          cluster.films.push(film);
          cluster.filmPlaces.set(film.id, group.place);
        }
      }
    } else {
      clusters.push({
        place: group.place,
        places: [group.place],
        films: [...group.films],
        filmPlaces: new Map(group.films.map((film) => [film.id, group.place])),
      });
    }
  }
  return clusters;
}
