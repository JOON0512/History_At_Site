# History At Site

영화를 따라 장소와 시대를 여행하는 작은 지구본. 역사적 사건, 신화, 현대의 일상과 사랑을 함께 담습니다.

현재는 **영화와 장소를 탐색하는 공유용 프로토타입**입니다. Sites로 정적 사이트를 배포하며, 로컬에서도 실행할 수 있습니다. Supabase 인증·커뮤니티 DB와 Didit 연결 코드를 포함합니다. 실제 계정과 서비스 설정은 각자 준비해야 하며, 공개 소스에는 운영 환경 식별자와 인증 설정값을 넣지 않았습니다.

## 실행

```sh
npm install
npm run dev
```

브라우저에서 터미널에 표시된 로컬 주소를 엽니다. Node.js 22.12 이상이 필요합니다. 기본 Node가 오래된 경우 `scripts/run.mjs`가 설치된 Codex의 최신 Node를 찾아 실행합니다. 전역 Node나 셸 설정을 바꾸지는 않습니다. 다른 컴퓨터에서는 최신 Node LTS를 설치하거나 `HAS_NODE_BINARY`로 실행 파일을 지정하세요.

```sh
npm run build
npm test
```

## 현재 구현

- Three.js 지구본: 마우스·터치 회전, 확대·축소, 자동 회전, 키보드 조작, 장소 선택 시 카메라 이동, 어느 지역에서도 육지가 보이는 카메라 기준 조명
- 기존 25편과 세계영화 컬렉션 500편, 한 작품의 여러 장소 연결
- 같은 장소의 영화를 하나의 핀으로 묶고 선택 목록에서 탐색 (홍콩의 화양연화·중경삼림 등)
- 제목·장소·국가·감독·시대 검색과 시대 필터, 빈 검색 결과 처리
- 장소별 프로그램북: 포스터, 배경 시대, 작품 정보, 맥락과 자료 출처, 예고편 링크
- 데스크톱과 모바일 화면, 이미지 실패 대체 표시, WebGL 실패 시 목록 탐색
- Supabase 연결용 이메일·비밀번호 가입과 로그인, 가입 확인·재전송, 비밀번호 재설정, 닉네임, 로그아웃
- 댓글 작성·조회·본인 댓글 삭제, 자료 링크·스포일러·신고 UI
- PostgreSQL RLS를 이용한 댓글 권한과 인증 데이터 분리, 작성 간격 제한
- Didit 여권·얼굴 인증 서버와 동의·철회 화면, 서명·세션·실제 환경 검사 (업체 연결 전 비활성)

첫 작품은 어바웃 타임, 택시운전사, 적벽대전, 트로이, 진주만, 태극기 휘날리며, 피아니스트, 크리스토퍼 놀란의 오디세이입니다. 영화 속 시간과 개봉 연도를 구분합니다. 지도는 현대의 지리 위에 서사의 장소를 연결하며 고대 국경이나 신화 속 지리를 확정하지 않습니다. 좌표는 대부분 도시·지역의 대표 지점으로, 개별 장면의 촬영 위치는 아닙니다.

## 자신의 환경에 연결하기

공개 소스에는 실제 계정·DB 데이터·서버 비밀값이 포함되어 있지 않습니다. 기존 개발 환경에서 이메일 가입·로그인과 세션 유지까지 확인했지만, 이 저장소를 복제하는 것만으로 해당 서버가 연결되지는 않습니다. 새 환경에서는 다음 순서로 설정합니다.

1. 자신의 Supabase 프로젝트를 만들고 `supabase/migrations/`의 마이그레이션을 순서대로 적용합니다. 기존 DB에 중복 적용하지 않습니다.
2. `.env.example`을 참고해 로컬 `.env.local`에 자신의 프로젝트 URL과 publishable key를 넣습니다. 서버 키는 브라우저 코드나 `VITE_` 환경변수에 넣지 않습니다.
3. [이메일 인증 연결 안내](docs/email-auth-setup.md)에 따라 가입·메일 확인·로그인·비밀번호 복구를 확인한 뒤 `VITE_AUTH_EMAIL_DELIVERY_READY=true`로 빌드합니다.
4. Didit은 기본적으로 연결 전 상태입니다. [연결 안내](docs/identity-verification-setup.md)와 [커뮤니티 운영](docs/community.md)을 참고해 별도 계정·워크플로·웹훅을 설정하고 실제 흐름을 검증해야 합니다.

권한 테스트는 PGlite PostgreSQL 엔진에서 실행합니다. 테스트용 신원은 로컬 메모리 DB에서만 사용합니다. 2026-10-24 공개본 검증에서는 원격 계정 설정이나 실제 가입·메일 발송·비밀번호 복구·Didit 인증을 다시 실행하지 않았습니다.

## 프로젝트 구성

| 경로                                    | 역할                              |
| --------------------------------------- | --------------------------------- |
| `src/data/films.ts`                     | 작품, 장소, 배경 시대, 맥락, 출처 |
| `src/components/Globe.tsx`              | 3D 지구본과 지도 핀               |
| `src/App.tsx` / `src/styles.css`        | 탐색 화면과 프로그램북            |
| `src/components/Community.tsx`          | 댓글·자료·신고                    |
| `src/components/AccountDialog.tsx`      | 이메일 로그인·계정                |
| `src/lib/community.ts`                  | Supabase 연결과 입력 검사         |
| `supabase/migrations/001_community.sql` | 서버 데이터 구조와 접근 제어      |
| `tests/community-db.test.ts`            | 실제 SQL 권한 검증                |

## 영화 추가

첫 8편은 `src/data/films.ts`, 다음 17편은 `src/data/collection-expansion.ts`, 세계영화 500편은 `src/data/world-cinema/catalogue.json`에서 관리합니다. 개봉 연도, 배경 시대, 대표 좌표, 지점의 의미, 자료 출처를 따로 입력하세요. 같은 장소는 동일한 `Place.id`와 좌표를 사용하면 지도에서 묶입니다. 여러 시대에 걸친 작품은 `additionalEras`로 함께 검색할 시대를 지정합니다. 신화의 시간은 확정 연대로 바꾸지 않습니다.

새 작품의 `id`를 등록하는 SQL 마이그레이션도 함께 추가합니다. 테스트가 화면의 작품과 DB의 등록 목록을 대조합니다. 포스터 출처는 `scripts/fetch-posters.py`에 추가하고 해당 영화 ID를 인자로 실행하면 기존 이미지를 다시 받지 않고 가져옵니다. 출처 기록은 다운로드 실패 시에도 보존됩니다. 제목이나 좌표만으로 실제 촬영지라고 단정하지 않습니다.

## 자료와 이미지

- 기획의 출발: [HAS를 시작하며](https://velog.io/@noojoh/HAS%EB%A5%BC-%EC%8B%9C%EC%9E%91%ED%95%98%EB%A9%B0)
- 각 영화 설명의 참조는 `src/data/`의 작품 데이터와 화면의 ‘이야기와 실제 세계의 연결’에 있습니다.
- 포스터 출처와 이미지 URL: `public/posters/sources.json`. 작품 소개를 위한 로컬 시안의 홍보 이미지이며 저작권은 각 권리자에게 있습니다. 공개 서비스용 이미지 이용 조건은 별도로 정해야 합니다.
- 지구 표면: [Three.js 공식 예제 텍스처](https://github.com/mrdoob/three.js/blob/dev/examples/textures/planets/earth_atmos_2048.jpg)
- 글꼴: Google Fonts의 DM Sans, Noto Sans KR, 고운바탕. 외부 글꼴이 로드되지 않으면 시스템 글꼴로 표시합니다.

## 검증 기록

- 빌드 및 TypeScript 검사
- 실제 PostgreSQL 엔진에서 비인증·위장 작성·국적 변조·만료·차단·삭제·신고 권한 검사
- 검색·시대 조합, 위험한 자료 URL, 댓글 길이와 인증 상태 검사
- 브라우저에서 작품 선택·검색·빈 결과·시대 필터·로그인 안내·모바일 배치 확인

기술 참고: [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html), [Supabase 이메일 로그인](https://supabase.com/docs/guides/auth/auth-email-passwordless), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).


## 공개 저장소 검증

2026-10-24에 테스트 43개와 TypeScript·Vite 프로덕션 빌드를 다시 통과했습니다. 로컬 인증 설정, 실제 사용자 데이터, 배포 프로젝트 식별자는 포함하지 않았습니다. 빌드에서 일부 JS 청크가 500 kB를 넘는 크기 경고가 남아 있습니다.

공개 준비 과정에서 운영 프로젝트 식별자·호스팅 주소·계정별 SMTP 상태를 제거하고 문서와 Origin 설정을 예시 도메인으로 교체했습니다. 배포할 때 자신의 설정을 입력해야 합니다.

2026-10-25: 위 공개용 설정 정리 후 테스트 43개와 프로덕션 빌드를 다시 통과했습니다.
