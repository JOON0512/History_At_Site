import type { Film, Place } from "./films";

const hongKong: Place = {
  id: "hong-kong",
  name: "홍콩",
  country: "홍콩",
  lat: 22.3193,
  lng: 114.1694,
  note: "이야기의 배경 · 도시 대표 지점",
};

export const expandedFilms: Film[] = [
  {
    id: "in-the-mood-for-love",
    title: "화양연화",
    originalTitle: "In the Mood for Love",
    release: "2000",
    director: "왕가위",
    era: "twentieth",
    period: "1962년부터 · 1960년대",
    category: "일상과 사랑",
    color: "#b77c70",
    poster: "/posters/in-the-mood-for-love.jpg",
    intro: "스쳐 지나가는 복도에도, 한 시대가 남는다.",
    experience:
      "좁은 계단과 국수 가게, 이웃의 소리가 스며드는 셋방. 두 사람의 조심스러운 만남을 따라 1960년대 홍콩의 생활 공간으로 들어갑니다.",
    context:
      "1962년 홍콩에서 시작되는 허구의 로맨스입니다. 당시의 주거와 옷차림을 왕가위 특유의 미장센으로 재구성합니다. 핀은 이야기의 배경이며, 모든 장면이 홍콩에서 촬영됐다는 뜻은 아닙니다.",
    question:
      "색과 음악, 의상 중 그 시절 홍콩을 가장 강하게 떠올리게 한 것은 무엇인가요?",
    places: [hongKong],
    sources: [
      {
        label: "작품과 시대 · Criterion",
        url: "https://www.criterion.com/films/198-in-the-mood-for-love",
      },
    ],
  },
  {
    id: "chungking-express",
    title: "중경삼림",
    originalTitle: "Chungking Express",
    release: "1994",
    director: "왕가위",
    era: "twentieth",
    period: "1990년대",
    category: "도시와 일상",
    color: "#7aab9b",
    poster: "/posters/chungking-express.jpg",
    intro: "잠들지 않는 도시에서, 서로의 시간을 스친다.",
    experience:
      "붐비는 거리와 작은 음식점, 네온과 빠른 걸음들. 두 경찰관의 서로 다른 이야기를 통해 1990년대 홍콩의 속도와 외로움을 느껴봅니다.",
    context:
      "홍콩을 배경으로 한 두 편의 허구적 이야기가 이어집니다. 같은 도시를 담은 화양연화와 함께 보면 장소가 시대와 영화의 표현 방식에 따라 얼마나 다르게 느껴지는지 비교할 수 있습니다.",
    question: "화양연화의 홍콩과 중경삼림의 홍콩은 어떻게 다르게 느껴지나요?",
    places: [hongKong],
    sources: [
      {
        label: "작품 정보 · Criterion",
        url: "https://www.criterion.com/films/226",
      },
    ],
  },
  {
    id: "perfect-days",
    title: "퍼펙트 데이즈",
    originalTitle: "Perfect Days",
    release: "2023",
    director: "빔 벤더스",
    era: "contemporary",
    period: "현대 · 2020년대의 도쿄",
    category: "도시와 일상",
    color: "#93aaa0",
    poster: "/posters/perfect-days.jpg",
    intro: "매일 같은 길에서 발견하는, 다른 빛.",
    experience:
      "이른 아침의 출근길, 공원의 나무 그림자, 카세트테이프의 음악. 화장실 청소부 히라야마의 하루를 따라 도쿄의 작은 순간들을 들여다봅니다.",
    context:
      "시부야의 공중화장실을 청소하는 인물의 허구적 일상입니다. 지도는 도쿄의 대표 지점이며, 개별 화장실이나 인물의 집 주소를 표시하지 않습니다. 배경 연도는 명시된 사건 연대 대신 현대의 분위기로 분류했습니다.",
    question: "내 도시에서도 히라야마처럼 매일 눈여겨보고 싶은 풍경이 있나요?",
    places: [
      {
        id: "tokyo",
        name: "도쿄",
        country: "일본",
        lat: 35.6762,
        lng: 139.6503,
        note: "이야기의 배경 · 도시 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품과 장소 · 일본영화 데이터베이스",
        url: "https://jfdb.jp/en/title/9946",
      },
      {
        label: "작품 소개 · 공식 사이트",
        url: "https://www.perfectdays-movie.jp/en/story/",
      },
    ],
  },
  {
    id: "cinema-paradiso",
    title: "시네마 천국",
    originalTitle: "Cinema Paradiso",
    release: "1988",
    director: "주세페 토르나토레",
    era: "twentieth",
    period: "제2차 세계대전 이후의 기억",
    category: "기억과 성장",
    color: "#bc9e71",
    poster: "/posters/cinema-paradiso.jpg",
    intro: "마을의 모든 얼굴이 모이던 작은 영화관.",
    experience:
      "광장과 영사실, 스크린 앞에서 함께 웃는 사람들. 토토의 어린 시절을 통해 전후 시칠리아의 마을과 영화관 문화를 만나봅니다.",
    context:
      "고향을 떠난 영화감독이 어린 시절을 돌아보는 극영화입니다. 영화 속 마을을 실재하는 단일 도시로 단정하지 않고 시칠리아 지역의 대표 지점에 연결했습니다.",
    question: "당신에게도 한 시절의 풍경으로 남아 있는 영화관이 있나요?",
    places: [
      {
        id: "sicily",
        name: "시칠리아",
        country: "이탈리아",
        lat: 37.6,
        lng: 14.0154,
        note: "이야기의 배경 지역 · 가상 마을의 정확한 위치 아님",
      },
    ],
    sources: [
      {
        label: "작품과 배경 · BFI",
        url: "https://player.bfi.org.uk/subscription/film/watch-cinema-paradiso-1988-online",
      },
    ],
  },
  {
    id: "amelie",
    title: "아멜리에",
    originalTitle: "Amélie",
    release: "2001",
    director: "장피에르 주네",
    era: "twentieth",
    period: "1990년대 후반",
    category: "일상과 사랑",
    color: "#a4ac73",
    poster: "/posters/amelie.jpg",
    intro: "작은 친절 하나로 달라지는 파리의 지도.",
    experience:
      "몽마르트르의 카페와 골목, 동네 가게의 사소한 물건들. 아멜리에의 장난스러운 시선을 따라 일상의 도시가 동화처럼 변합니다.",
    context:
      "파리 몽마르트르를 배경으로 한 허구의 로맨스입니다. 강한 색채와 상상적 장면은 감독의 표현이며, 영화 속 파리의 모습이 도시의 모든 생활상을 대표하지는 않습니다.",
    question:
      "아멜리에의 파리에서 가장 오래 머물고 싶은 일상의 장소는 어디인가요?",
    places: [
      {
        id: "paris",
        name: "파리",
        country: "프랑스",
        lat: 48.8566,
        lng: 2.3522,
        note: "이야기의 배경 · 몽마르트르 지역 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 소개 · Sony Pictures Classics",
        url: "https://www.sonyclassics.com/film/amelie",
      },
      {
        label: "배경 시기 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Am%C3%A9lie",
      },
    ],
  },
  {
    id: "before-sunrise",
    title: "비포 선라이즈",
    originalTitle: "Before Sunrise",
    release: "1995",
    director: "리처드 링클레이터",
    era: "twentieth",
    period: "1990년대의 어느 하루",
    category: "일상과 사랑",
    color: "#bfa586",
    poster: "/posters/before-sunrise.jpg",
    intro: "처음 만난 사람과, 처음 걷는 도시.",
    experience:
      "기차에서 시작된 만남이 빈의 거리와 카페, 밤의 산책으로 이어집니다. 대화의 속도로 도시를 걸으며 1990년대 유럽 여행의 공기를 만나보세요.",
    context:
      "두 여행자가 빈에서 함께 보내는 하루를 담은 허구의 이야기입니다. 영화의 배경과 주요 촬영 도시가 빈이라는 점을 연결했으며, 핀은 특정 대화 장면의 정확한 위치가 아닙니다.",
    question: "목적지 없이 걸으며 나눈 대화가 기억나는 도시가 있나요?",
    places: [
      {
        id: "vienna",
        name: "빈",
        country: "오스트리아",
        lat: 48.2082,
        lng: 16.3738,
        note: "이야기의 배경 · 도시 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 소개 · Criterion",
        url: "https://www.criterion.com/boxsets/1237-the-before-trilogy",
      },
      {
        label: "빈의 영화 속 장소 · BFI",
        url: "https://www.bfi.org.uk/features/before-sunrise-richard-linklater-vienna-locations",
      },
    ],
  },
  {
    id: "roma",
    title: "로마",
    originalTitle: "Roma",
    release: "2018",
    director: "알폰소 쿠아론",
    era: "twentieth",
    period: "1970년대 초",
    category: "도시와 일상",
    color: "#b1b4b1",
    poster: "/posters/roma.png",
    intro: "한 집의 하루에, 도시의 시간이 스며든다.",
    experience:
      "가사를 돌보는 클레오의 시선으로 집과 거리, 영화관을 오갑니다. 흑백 화면 안에서 1970년대 멕시코시티의 소리와 생활을 만나봅니다.",
    context:
      "제목의 로마는 이탈리아의 도시가 아니라 멕시코시티의 지역 이름입니다. 감독의 어린 시절 기억을 바탕으로 재구성한 극영화이며 가족의 일상과 사회적 변화가 겹칩니다.",
    question:
      "흑백 화면이 오히려 더 선명하게 느끼게 한 도시의 풍경은 무엇인가요?",
    places: [
      {
        id: "mexico-city",
        name: "멕시코시티",
        country: "멕시코",
        lat: 19.4326,
        lng: -99.1332,
        note: "이야기의 배경 · 로마 지역 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품과 시대 · Criterion",
        url: "https://www.criterion.com/films/30124-roma",
      },
    ],
  },
  {
    id: "city-of-god",
    title: "시티 오브 갓",
    originalTitle: "City of God",
    release: "2002",
    director: "페르난두 메이렐리스 · 공동연출 카치아 룬드",
    era: "twentieth",
    period: "1960년대–1980년대 초",
    category: "도시와 사회",
    color: "#c59a62",
    poster: "/posters/city-of-god.jpg",
    intro: "카메라를 든 소년이 바라본, 자신의 동네.",
    experience:
      "리우데자네이루의 주거지와 골목, 사진에 담기는 얼굴들. 한 소년의 성장을 따라 빠르게 달라지는 동네와 그 안의 삶을 마주합니다.",
    context:
      "파울루 린스의 소설을 각색한 극영화로 시다지 지 데우스 지역을 배경으로 합니다. 범죄와 폭력에 집중한 서사를 오늘날 리우 전체의 모습으로 일반화하지 않도록 배경 시기와 지역을 구분했습니다.",
    question:
      "이 지역의 일상과 역사를 다른 시선으로 볼 수 있는 작품이나 자료가 있나요?",
    places: [
      {
        id: "rio-de-janeiro",
        name: "리우데자네이루",
        country: "브라질",
        lat: -22.9068,
        lng: -43.1729,
        note: "이야기가 놓인 도시 · 특정 장면이나 거주지 아님",
      },
    ],
    sources: [
      {
        label: "작품 소개 · Miramax",
        url: "https://www.miramax.com/movie/city-of-god/",
      },
      {
        label: "시대와 제작 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/City_of_God_(2002_film)",
      },
    ],
  },
  {
    id: "motorcycle-diaries",
    title: "모터싸이클 다이어리",
    originalTitle: "The Motorcycle Diaries",
    release: "2004",
    director: "월터 살레스",
    era: "twentieth",
    period: "1952년",
    category: "여행과 성장",
    color: "#a1b094",
    poster: "/posters/motorcycle-diaries.jpg",
    intro: "길 위에서 만난 사람들로, 세계가 달라진다.",
    experience:
      "부에노스아이레스에서 출발해 안데스의 풍경과 마추픽추로. 두 청년의 여정을 따라 1950년대 남미의 여러 장소와 사람들을 만납니다.",
    context:
      "에르네스토 게바라와 알베르토 그라나도의 여행 기록을 바탕으로 각색한 작품입니다. 지도에는 출발 도시와 여정 중의 유적 두 곳을 담았으며, 전체 여행 경로를 표시한 것은 아닙니다.",
    question: "여행 중 어떤 만남이 두 사람의 시선을 바꿨다고 느꼈나요?",
    places: [
      {
        id: "buenos-aires",
        name: "부에노스아이레스",
        country: "아르헨티나",
        lat: -34.6037,
        lng: -58.3816,
        note: "여행의 출발 도시 · 대표 지점",
      },
      {
        id: "machu-picchu",
        name: "마추픽추",
        country: "페루",
        lat: -13.1631,
        lng: -72.545,
        note: "영화 속 여행지 · 유적 대표 지점",
      },
    ],
    sources: [
      {
        label: "여행 기록과 영화 · Focus Features",
        url: "https://www.focusfeatures.com/article/focusbookclub-the-motorcycle-diaries_walter-salles",
      },
      {
        label: "여정과 작품 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/The_Motorcycle_Diaries_(film)",
      },
    ],
  },
  {
    id: "out-of-africa",
    title: "아웃 오브 아프리카",
    originalTitle: "Out of Africa",
    release: "1985",
    director: "시드니 폴락",
    era: "twentieth",
    period: "20세기 초 · 식민지 시기",
    category: "기억과 사랑",
    color: "#b8a073",
    poster: "/posters/out-of-africa.jpg",
    intro: "농장과 먼 지평선 사이에 남겨진 기억.",
    experience:
      "나이로비 인근의 커피 농장과 케냐의 넓은 풍경. 카렌 블릭센의 삶에서 출발한 이야기를 따라 20세기 초 동아프리카로 향합니다.",
    context:
      "식민지 시기 케냐를 유럽 출신 이주민의 시선으로 그린 전기적 로맨스입니다. 개인의 회고와 영화적 각색이 섞여 있으며 케냐 사람들의 경험 전체를 대표하는 기록은 아닙니다. 핀은 나이로비의 대표 지점입니다.",
    question:
      "같은 시대와 지역을 현지인의 시선으로 담은 자료도 함께 찾아볼까요?",
    places: [
      {
        id: "nairobi",
        name: "나이로비와 주변 지역",
        country: "케냐",
        lat: -1.2921,
        lng: 36.8219,
        note: "이야기와 연결한 지역 · 농장 건물의 정확한 좌표 아님",
      },
    ],
    sources: [
      {
        label: "작품 소개 · Universal Pictures",
        url: "https://www.universalpicturesathome.com/movies/out-of-africa",
      },
    ],
  },
  {
    id: "a-separation",
    title: "씨민과 나데르의 별거",
    originalTitle: "A Separation",
    release: "2011",
    director: "아쉬가르 파르하디",
    era: "contemporary",
    period: "현대 · 2010년대 무렵",
    category: "가족과 사회",
    color: "#9ba8a2",
    poster: "/posters/a-separation.png",
    intro: "한 가족의 갈림길에서, 도시의 삶을 들여다본다.",
    experience:
      "집과 직장, 법원을 오가는 사람들. 돌봄과 생계, 가족을 둘러싼 선택을 따라 현대 테헤란의 생활 공간에 다가갑니다.",
    context:
      "현대 이란을 배경으로 한 허구의 가족 드라마입니다. 서로 다른 처지의 인물들이 맞부딪히는 이야기를 다루며, 하나의 가족을 이란 사회 전체의 전형으로 제시하지 않습니다. 배경 연도는 확정하지 않았습니다.",
    question: "서로 다른 인물의 입장을 이해하게 된 장면은 무엇이었나요?",
    places: [
      {
        id: "tehran",
        name: "테헤란",
        country: "이란",
        lat: 35.6892,
        lng: 51.389,
        note: "이야기의 배경 · 도시 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 소개 · Sony Pictures Classics",
        url: "https://www.sonyclassics.com/aseparation/synopsis.html",
      },
      {
        label: "도시와 제작 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/A_Separation",
      },
    ],
  },
  {
    id: "slumdog-millionaire",
    title: "슬럼독 밀리어네어",
    originalTitle: "Slumdog Millionaire",
    release: "2008",
    director: "대니 보일 · 공동연출 러브린 탄단",
    era: "contemporary",
    additionalEras: ["twentieth"],
    period: "1990년대–2000년대",
    category: "도시와 성장",
    color: "#b9a274",
    poster: "/posters/slumdog-millionaire.png",
    intro: "퀴즈의 답마다, 살아온 도시가 떠오른다.",
    experience:
      "뭄바이의 골목과 기차역, 빠르게 변하는 도시의 표정. 자말의 어린 시절과 현재를 오가며 기억이 쌓인 장소들을 따라갑니다.",
    context:
      "비카스 스와루프의 소설을 바탕으로 만든 허구의 이야기입니다. 여러 시기의 회상을 포함해 20세기와 현대 필터에 함께 표시합니다. 빈곤과 모험에 집중한 영화의 시선이 도시 전체를 설명하지는 않습니다.",
    question: "자말의 기억을 따라갈 때 도시가 달라 보였던 순간은 언제였나요?",
    places: [
      {
        id: "mumbai",
        name: "뭄바이",
        country: "인도",
        lat: 19.076,
        lng: 72.8777,
        note: "이야기의 배경 · 도시 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 소개 · Searchlight Pictures",
        url: "https://www.searchlightpictures.com/SLUMDOGMILLIONAIRE",
      },
      {
        label: "배경 시기 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Slumdog_Millionaire",
      },
    ],
  },
  {
    id: "rabbit-proof-fence",
    title: "토끼 울타리",
    originalTitle: "Rabbit-Proof Fence",
    release: "2002",
    director: "필립 노이스",
    era: "twentieth",
    period: "1931년",
    category: "역사의 순간",
    color: "#be966e",
    poster: "/posters/rabbit-proof-fence.jpg",
    intro: "집으로 돌아가기 위해, 울타리를 따라 걷는다.",
    experience:
      "서호주의 넓은 땅과 끝없이 이어지는 울타리. 가족에게서 강제로 분리된 아이들의 귀향길을 따라 풍경 속에 남은 역사를 마주합니다.",
    context:
      "몰리의 딸 도리스 필킹턴 가리마라가 쓴 책을 토대로 한 극영화입니다. 1931년 원주민 아동 강제 분리 정책과 연결되며, 지점은 아이들의 고향 지갈롱입니다. 전체 도보 경로나 촬영지를 뜻하지 않습니다.",
    question: "이 이야기와 호주의 원주민 역사를 함께 이해할 자료를 나눠주세요.",
    places: [
      {
        id: "jigalong",
        name: "지갈롱 · 서호주",
        country: "호주",
        lat: -23.36,
        lng: 120.78,
        note: "아이들의 고향 · 지역 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품과 역사 · 호주 국립영상음향기록원",
        url: "https://www.nfsa.gov.au/collection/curated/rabbit-proof-fence",
      },
      {
        label: "지갈롱으로의 여정 · NFSA",
        url: "https://www.nfsa.gov.au/collection/item/rabbit-proof-fence-wrong-fence",
      },
    ],
  },
  {
    id: "the-piano",
    title: "피아노",
    originalTitle: "The Piano",
    release: "1993",
    director: "제인 캠피온",
    era: "nineteenth",
    period: "19세기 중반",
    category: "일상과 사랑",
    color: "#85969b",
    poster: "/posters/the-piano.jpg",
    intro: "낯선 해변 위에 놓인, 목소리 대신의 악기.",
    experience:
      "거친 해안과 비에 젖은 숲, 피아노 소리. 스코틀랜드에서 온 에이다의 시선을 통해 19세기 뉴질랜드의 낯선 공간을 만납니다.",
    context:
      "19세기 뉴질랜드를 배경으로 한 허구의 이야기입니다. 핀은 영화의 해변 촬영지인 북섬 카레카레에 연결했습니다. 촬영 장소와 서사 속 배경의 정확한 위치를 동일시하지 않습니다.",
    question: "대사보다 음악과 풍경이 더 많은 것을 전해준 순간이 있었나요?",
    places: [
      {
        id: "karekare",
        name: "카레카레 · 북섬",
        country: "뉴질랜드",
        lat: -36.986,
        lng: 174.478,
        note: "실제 해변 촬영지 · 서사 속 마을의 확정 위치 아님",
      },
    ],
    sources: [
      {
        label: "작품과 시대 · Criterion",
        url: "https://www.criterion.com/films/30424-the-piano",
      },
      {
        label: "카레카레 촬영지 · 뉴질랜드 관광청",
        url: "https://www.newzealand.com/ca/feature/new-zealand-directors-top-10-film-locations/",
      },
    ],
  },
  {
    id: "gladiator",
    title: "글래디에이터",
    originalTitle: "Gladiator",
    release: "2000",
    director: "리들리 스콧",
    era: "ancient",
    period: "서기 180년 무렵",
    category: "역사와 상상",
    color: "#b59b77",
    poster: "/posters/gladiator.png",
    intro: "경기장의 함성 너머로 보이는 제국의 도시.",
    experience:
      "거대한 원형경기장과 군중, 권력의 공간. 검투사가 된 장군의 이야기를 통해 고대 로마를 영화의 상상력으로 만나봅니다.",
    context:
      "실존 황제와 로마 제국을 배경으로 허구의 주인공을 만든 극영화입니다. 인물의 죽음과 사건의 전개 등 실제 기록과 다른 각색이 있습니다. 핀은 로마의 대표 지점이며 실제 세트 촬영지가 아닙니다.",
    question: "영화의 로마와 유적·기록으로 보는 로마는 어떻게 다른가요?",
    places: [
      {
        id: "rome",
        name: "로마",
        country: "이탈리아",
        lat: 41.9028,
        lng: 12.4964,
        note: "이야기의 배경 · 도시 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품과 역사적 각색 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Gladiator_(2000_film)",
      },
    ],
  },
  {
    id: "timbuktu",
    title: "팀북투",
    originalTitle: "Timbuktu",
    release: "2014",
    director: "압데라만 시사코",
    era: "contemporary",
    period: "2010년대 · 무장세력 점령기",
    category: "도시와 사회",
    color: "#b8a17c",
    poster: "/posters/timbuktu.jpg",
    intro: "모래빛 도시에서, 일상을 지키는 사람들.",
    experience:
      "사막 가장자리의 가족과 팀북투의 거리. 음악과 놀이까지 통제받는 상황 속에서도 자신의 삶을 이어가려는 사람들을 바라봅니다.",
    context:
      "말리 팀북투와 주변을 배경으로 무장세력의 통치를 다루는 극영화입니다. 인물의 이야기는 영화적 구성입니다. 지도는 서사의 도시를 표시하며 모리타니 등 실제 촬영 지역과 구분합니다.",
    question:
      "일상을 지키려는 인물들의 행동 중 가장 기억에 남는 것은 무엇인가요?",
    places: [
      {
        id: "timbuktu",
        name: "팀북투",
        country: "말리",
        lat: 16.7666,
        lng: -3.0026,
        note: "이야기의 배경 · 도시 대표 지점",
      },
    ],
    sources: [
      {
        label: "작품 소개 · Cohen Media Group",
        url: "https://cohenmedia.net/product/timbuktu",
      },
      {
        label: "배경과 촬영 정보 · Wikipedia",
        url: "https://en.wikipedia.org/wiki/Timbuktu_(2014_film)",
      },
    ],
  },
  {
    id: "the-last-emperor",
    title: "마지막 황제",
    originalTitle: "The Last Emperor",
    release: "1987",
    director: "베르나르도 베르톨루치",
    era: "twentieth",
    period: "1908년부터 · 20세기 중국",
    category: "역사의 순간",
    color: "#b79164",
    poster: "/posters/the-last-emperor.jpg",
    intro: "궁궐의 문 안팎에서, 한 시대가 바뀐다.",
    experience:
      "어린 황제의 자금성과 거대한 궁궐의 의례. 푸이의 삶을 따라 궁 안의 세계와 그 바깥에서 변해가는 20세기 중국을 만나봅니다.",
    context:
      "중국의 마지막 황제 푸이의 삶을 영화적으로 재구성한 전기극입니다. 자금성은 주요 배경이자 실제 촬영 장소지만, 하나의 핀이 영화의 모든 시기와 이동을 대표하지는 않습니다.",
    question:
      "궁궐이라는 공간이 인물에게 어떻게 다르게 느껴지는지 함께 이야기해볼까요?",
    places: [
      {
        id: "beijing-forbidden-city",
        name: "베이징 · 자금성",
        country: "중국",
        lat: 39.9163,
        lng: 116.3972,
        note: "주요 이야기 배경이자 실제 촬영 장소",
      },
    ],
    sources: [
      {
        label: "작품과 시대 · Criterion",
        url: "https://www.criterion.com/films/254",
      },
      {
        label: "자금성 촬영 · Criterion",
        url: "https://www.criterion.com/current/posts/6071-the-knotty-legacy-of-bernardo-bertolucci",
      },
    ],
  },
];
