import { expandedFilms } from "./collection-expansion";
import worldCinema from "./world-cinema/catalogue.json";

export type Era =
  | "myth"
  | "ancient"
  | "medieval"
  | "early-modern"
  | "nineteenth"
  | "twentieth"
  | "contemporary";
export type Place = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  note: string;
};
export type Film = {
  id: string;
  title: string;
  originalTitle: string;
  release: string;
  director: string;
  era: Era;
  additionalEras?: Era[];
  period: string;
  category: string;
  color: string;
  poster?: string;
  intro: string;
  experience: string;
  context: string;
  question: string;
  places: Place[];
  sources: { label: string; url: string }[];
  trailer?: string;
  pending?: boolean;
};

export const films: Film[] = [
  {
    id: "about-time",
    title: "어바웃 타임",
    originalTitle: "About Time",
    release: "2013",
    director: "리처드 커티스",
    era: "contemporary",
    period: "현대",
    category: "일상과 사랑",
    color: "#d7af7b",
    poster: "/posters/about-time.jpg",
    intro: "다시 살고 싶은 하루가 있는 곳.",
    experience:
      "런던의 분주한 거리와 콘월의 바닷바람. 거대한 사건 대신, 한 가족의 평범한 하루를 따라 영국을 만나보세요.",
    context:
      "시간여행이라는 판타지 위에 놓인 현대 영국의 일상입니다. 런던과 콘월은 이야기의 배경이자 실제 촬영 지역이지만, 지도에는 개별 장면의 정확한 촬영점 대신 대표 지점을 표시했습니다.",
    question: "이 영화에서 다시 걷고 싶은 장소는 어디인가요?",
    places: [
      {
        id: "london",
        name: "런던",
        country: "영국",
        lat: 51.5074,
        lng: -0.1278,
        note: "이야기의 배경 · 도시 대표 지점",
      },
      {
        id: "cornwall",
        name: "콘월",
        country: "영국",
        lat: 50.26,
        lng: -5.05,
        note: "이야기의 배경 · 지역 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/About_Time_(2013_film)",
      },
      {
        label: "콘월의 영화 촬영지 · Visit Cornwall",
        url: "https://www.visitcornwall.com/things-to-do/film-and-tv/cornwall-on-film",
      },
    ],
  },
  {
    id: "taxi-driver",
    title: "택시운전사",
    originalTitle: "A Taxi Driver",
    release: "2017",
    director: "장훈",
    era: "twentieth",
    period: "1980년 5월",
    category: "역사의 순간",
    color: "#83ac9c",
    poster: "/posters/taxi-driver.jpg",
    intro: "택시 한 대가 마주한, 그해 오월.",
    experience:
      "서울에서 광주로 향하는 길. 거리와 사람들의 표정을 통해 1980년 5월의 광주에 다가갑니다.",
    context:
      "5·18민주화운동과 독일 기자 위르겐 힌츠페터의 취재를 바탕으로 한 극영화입니다. 실제 인물과 사건에서 출발하지만 인물 관계와 세부 장면에는 각색이 포함됩니다.",
    question: "광주의 장소와 기억을 이해하는 데 도움이 되는 자료가 있나요?",
    places: [
      {
        id: "gwangju",
        name: "광주",
        country: "대한민국",
        lat: 35.146,
        lng: 126.919,
        note: "이야기의 배경 · 광주 도심 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/A_Taxi_Driver",
      },
    ],
  },
  {
    id: "red-cliff",
    title: "적벽대전",
    originalTitle: "Red Cliff",
    release: "2008–2009",
    director: "오우삼",
    era: "ancient",
    period: "서기 208년 무렵",
    category: "역사의 순간",
    color: "#ba866f",
    poster: "/posters/red-cliff.jpg",
    intro: "강 위로 흐르는 바람, 시대를 바꾸는 전투.",
    experience:
      "장강을 사이에 둔 진영과 물 위의 배들. 후한 말의 전쟁을 거대한 강의 풍경 속에서 상상해봅니다.",
    context:
      "적벽 전투를 소재로 역사와 문학적 전승을 영화적으로 재구성한 2부작입니다. 지도는 오늘날 후베이성 츠비의 대표 지점을 가리키며, 전투 위치의 모든 학설을 확정하는 표시는 아닙니다.",
    question: "영화 속 묘사와 역사 기록, 삼국지연의는 어떻게 다른가요?",
    places: [
      {
        id: "chibi",
        name: "적벽 · 츠비",
        country: "중국",
        lat: 29.88,
        lng: 113.63,
        note: "사건 관련 지역 · 전투 위치는 이견이 있음",
      },
    ],
    sources: [
      {
        label: "작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Red_Cliff_(film)",
      },
    ],
  },
  {
    id: "troy",
    title: "트로이",
    originalTitle: "Troy",
    release: "2004",
    director: "볼프강 페테르젠",
    era: "myth",
    period: "신화 속 트로이 전쟁",
    category: "신화와 서사",
    color: "#b29b73",
    poster: "/posters/troy.png",
    intro: "바다를 건너, 전설 속 성벽 앞으로.",
    experience:
      "에게해를 건너는 함대와 트로이의 성벽. 고대 서사 속 인물들이 살았을 세계를 영화의 상상력으로 만납니다.",
    context:
      "호메로스의 서사와 트로이 전쟁 전승을 바탕으로 한 작품입니다. 신화의 사건을 확정된 역사 연대에 배치하지 않습니다. 지점은 현재 튀르키예의 트로이 유적이며 영화 촬영지를 뜻하지 않습니다.",
    question: "신화를 영화로 옮길 때 어떤 변화가 가장 인상적이었나요?",
    places: [
      {
        id: "troy",
        name: "트로이",
        country: "튀르키예",
        lat: 39.9575,
        lng: 26.2389,
        note: "서사와 연결한 유적 · 촬영지 아님",
      },
    ],
    sources: [
      {
        label: "작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Troy_(film)",
      },
    ],
  },
  {
    id: "pearl-harbor",
    title: "진주만",
    originalTitle: "Pearl Harbor",
    release: "2001",
    director: "마이클 베이",
    era: "twentieth",
    period: "1941–1942년",
    category: "역사의 순간",
    color: "#809aab",
    poster: "/posters/pearl-harbor.jpg",
    intro: "평온한 섬에 전쟁이 닿았던 날.",
    experience:
      "하와이의 바다와 군항, 그리고 일상이 무너지는 순간. 태평양 전쟁의 한 장면을 인물들의 시선으로 따라갑니다.",
    context:
      "1941년 진주만 공격 등 실제 사건을 배경으로 허구의 인물과 로맨스를 엮은 극영화입니다. 영화의 전투 묘사와 실제 기록을 구분해서 살펴볼 수 있습니다.",
    question: "당시 하와이의 일상을 더 잘 보여주는 기록이 있을까요?",
    places: [
      {
        id: "pearl-harbor",
        name: "진주만 · 하와이",
        country: "미국",
        lat: 21.365,
        lng: -157.95,
        note: "사건의 배경 · 진주만 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Pearl_Harbor_(film)",
      },
    ],
  },
  {
    id: "taegukgi",
    title: "태극기 휘날리며",
    originalTitle: "Taegukgi",
    release: "2004",
    director: "강제규",
    era: "twentieth",
    period: "1950년대 · 한국전쟁",
    category: "역사의 순간",
    color: "#ab947c",
    poster: "/posters/taegukgi.jpg",
    intro: "두 형제의 일상 위로 전쟁이 지나간다.",
    experience:
      "전쟁 전 서울의 골목에서 한반도의 전장으로. 두 형제의 여정을 따라 전쟁이 일상을 바꾸는 모습을 마주합니다.",
    context:
      "한국전쟁을 배경으로 한 허구의 가족 이야기입니다. 서울은 여정의 출발점을 나타냅니다. 하나의 핀으로 전쟁 전체의 공간이나 영화의 모든 전투를 대표하지 않습니다.",
    question: "영화 속 생활상에서 궁금해진 당시의 풍경이 있나요?",
    places: [
      {
        id: "seoul",
        name: "서울",
        country: "대한민국",
        lat: 37.5665,
        lng: 126.978,
        note: "이야기의 출발점 · 서울 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Taegukgi_(film)",
      },
    ],
  },
  {
    id: "pianist",
    title: "피아니스트",
    originalTitle: "The Pianist",
    release: "2002",
    director: "로만 폴란스키",
    era: "twentieth",
    period: "1939–1945년",
    category: "역사의 순간",
    color: "#a7a59b",
    poster: "/posters/pianist.jpg",
    intro: "한 도시의 침묵 속에 남은 음악.",
    experience:
      "전쟁 속 바르샤바의 거리와 창문 너머의 풍경. 피아니스트의 생존을 따라 한 도시가 겪은 상실을 바라봅니다.",
    context:
      "폴란드 유대인 피아니스트 브와디스와프 슈필만의 회고록을 바탕으로 나치 점령기의 바르샤바를 그립니다. 실제 경험을 토대로 만들어진 영화적 재현입니다.",
    question: "전쟁 이전과 이후의 바르샤바를 함께 볼 수 있는 자료가 있나요?",
    places: [
      {
        id: "warsaw",
        name: "바르샤바",
        country: "폴란드",
        lat: 52.2297,
        lng: 21.0122,
        note: "이야기의 배경 · 도시 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/The_Pianist_(2002_film)",
      },
    ],
  },
  {
    id: "odyssey",
    title: "오디세이",
    originalTitle: "The Odyssey",
    release: "2026",
    director: "크리스토퍼 놀란",
    era: "myth",
    period: "신화 속 귀향의 여정",
    category: "신화와 서사",
    color: "#799b9f",
    poster: "/posters/odyssey.jpg",
    intro: "집으로 돌아가는 길, 하나의 세계가 되다.",
    experience:
      "호메로스의 서사를 따라 지중해와 귀향의 목적지 이타카를 연결합니다. 여행의 풍경은 공식 예고편에서 먼저 만나보세요.",
    context:
      "크리스토퍼 놀란이 호메로스의 오디세이아를 영화화한 작품입니다. 핀은 서사와 연결한 오늘날의 이타키섬을 나타냅니다. 신화 속 지리를 확정하거나 영화의 실제 촬영 장소를 표시한 것은 아닙니다.",
    question: "오디세우스의 귀향길에서 가장 만나보고 싶은 풍경은 무엇인가요?",
    places: [
      {
        id: "ithaca",
        name: "이타카 · 이타키",
        country: "그리스",
        lat: 38.367,
        lng: 20.717,
        note: "서사와 연결한 섬 · 신화적 지리는 불확실",
      },
    ],
    sources: [
      {
        label: "공식 예고편 · Universal Pictures",
        url: "https://www.youtube.com/watch?v=f_bKjZeJBBI",
      },
    ],
    trailer: "https://www.youtube.com/watch?v=f_bKjZeJBBI",
  },
  ...expandedFilms,
  ...(worldCinema as Film[]),
];

export const eras: { id: Era | "all"; label: string; subtitle: string }[] = [
  { id: "all", label: "모든 시대", subtitle: "ALL ERAS" },
  { id: "myth", label: "신화의 시간", subtitle: "MYTH & LEGEND" },
  { id: "ancient", label: "고대", subtitle: "ANCIENT WORLD" },
  { id: "medieval", label: "중세", subtitle: "MEDIEVAL" },
  { id: "early-modern", label: "근세", subtitle: "EARLY MODERN" },
  { id: "nineteenth", label: "19세기", subtitle: "19TH CENTURY" },
  { id: "twentieth", label: "20세기", subtitle: "20TH CENTURY" },
  { id: "contemporary", label: "현대", subtitle: "CONTEMPORARY" },
];

export function filterFilms(query: string, era: Era | "all") {
  const needle = query.trim().toLocaleLowerCase();
  return films.filter(
    (f) =>
      (era === "all" || f.era === era || f.additionalEras?.includes(era)) &&
      [
        f.title,
        f.originalTitle,
        f.period,
        f.director,
        f.category,
        ...f.places.flatMap((p) => [p.name, p.country]),
      ].some((text) => text.toLocaleLowerCase().includes(needle)),
  );
}
