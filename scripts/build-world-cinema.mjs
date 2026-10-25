// Rebuild the shipped collection from curated editorial rows and checked source facts.
// This step is offline: no browsing, API keys, or automatic geographic guesses.
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const rows = (path) =>
  read(path)
    .split("\n")
    .filter((s) => s && !s.startsWith("#"))
    .map((s) => s.split("|"));
const metadata = JSON.parse(read("src/data/world-cinema/metadata.json"));
const facts = new Map(metadata.map((f) => [f.slug, f]));
const notes = {
  city: "이야기와 연결한 도시·장소의 대표 지점 · 개별 장면의 촬영점이 아님",
  region:
    "국가·권역을 나타내는 대표 지점 · 마을이나 장면의 정확한 위치를 특정하지 않음",
  inspiration:
    "허구의 지리를 이해하기 위한 영감 지역 · 영화 속 실제 위치가 아님",
};
const locations = new Map(
  rows("src/data/world-cinema/places.psv").map(
    ([id, name, country, lat, lng, precision]) => {
      if (
        !(precision in notes) ||
        !Number.isFinite(+lat) ||
        !Number.isFinite(+lng) ||
        Math.abs(+lat) > 90 ||
        Math.abs(+lng) > 180
      )
        throw new Error(`Invalid location: ${id}`);
      return [
        id,
        {
          id,
          name,
          country,
          lat: +lat,
          lng: +lng,
          note: notes[precision],
          precision,
        },
      ];
    },
  ),
);
const palette = [
  "#b89779",
  "#82a29e",
  "#bf9479",
  "#7e9fb2",
  "#b3a577",
  "#b58b92",
  "#8ca18a",
  "#a296b2",
];
const eraLabels = {
  myth: "설화와 상상",
  ancient: "고대의 세계",
  medieval: "중세의 세계",
  "early-modern": "근세의 삶",
  nineteenth: "19세기의 삶",
  twentieth: "20세기의 기억",
  contemporary: "도시와 일상",
};
const collection = rows("src/data/world-cinema/selection.psv").map(
  ([slug, title, placeKeys, eraList, period, experience]) => {
    const fact = facts.get(slug);
    if (!fact) throw new Error(`Unchecked film: ${slug}`);
    const places = placeKeys.split(",").map((key) => {
      const place = locations.get(key);
      if (!place) throw new Error(`Missing place ${key} for ${slug}`);
      return place;
    });
    const [era, ...additionalEras] = eraList.split(",");
    if ([era, ...additionalEras].some((e) => !(e in eraLabels)))
      throw new Error(`Invalid era: ${slug}`);
    const inspiration = places.some((p) => p.precision === "inspiration");
    const colorIndex =
      [...places[0].country].reduce((n, c) => n + c.codePointAt(0), 0) %
      palette.length;
    return {
      id: fact.id,
      title,
      originalTitle: fact.originalTitle,
      release: fact.release,
      director: fact.director,
      era,
      ...(additionalEras.length ? { additionalEras } : {}),
      period,
      category: eraLabels[era],
      color: palette[colorIndex],
      ...(fact.poster ? { poster: fact.poster } : {}),
      intro: `${period}, ${places[0].name}.`,
      experience,
      context: inspiration
        ? "작품 속 국가는 허구이거나 정확한 위치가 명시되지 않습니다. 지도에는 이야기의 영감이 된 지역을 표시했으며, 실제 배경이나 촬영 위치를 확정한 것은 아닙니다."
        : `배경 시기는 ${period}입니다. 지도는 ${places.map((p) => p.name).join(" · ")}의 도시·권역을 대표하며, 개별 장면의 촬영 좌표를 뜻하지 않습니다.`,
      question: `이 작품에서 장소와 시대의 분위기가 가장 잘 느껴진 장면은 무엇인가요?`,
      places: places.map(({ precision, ...place }) => place),
      sources: [{ label: "작품 정보 · Wikipedia", url: fact.url }],
    };
  },
);
if (
  collection.length !== 500 ||
  new Set(collection.map((f) => f.id)).size !== 500 ||
  new Set(collection.map((f) => f.sources[0].url)).size !== 500
)
  throw new Error("Expected 500 distinct, checked films");
writeFileSync(
  new URL("src/data/world-cinema/catalogue.json", root),
  JSON.stringify(collection, null, 2) + "\n",
);
console.log(
  `${collection.length} films, ${locations.size} locations; source facts checked, offline catalogue generated.`,
);
