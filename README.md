# History At Site

영화 속 장소와 시대를 따라가는 지구본.

지구본의 핀을 누르면 그 장소를 배경으로 한 영화를 볼 수 있습니다. 제목·장소·감독·시대로 검색하고, 작품의 배경과 자료 출처를 함께 읽습니다. 지도는 이야기의 배경을 표시하며 실제 촬영지를 뜻하지는 않습니다.

React · TypeScript · Three.js · Vite

## Run

Node.js 22.12 이상.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
```

영화 탐색은 별도 서버 설정 없이 실행됩니다. 계정과 댓글 기능은 `.env.example`을 참고해 Supabase를 연결해야 합니다. 본인 인증 연동은 기본적으로 비활성화되어 있습니다.

## Development

- [영화 데이터와 장소 추가](docs/film-catalogue.md)
- [이메일 로그인 설정](docs/email-auth-setup.md)
- [댓글과 권한 구조](docs/community.md)
- [본인 인증 연동](docs/identity-verification-setup.md)

작품 데이터는 `src/data/`, 지구본은 `src/components/Globe.tsx`에 있습니다. 포스터 출처는 `public/posters/sources.json`에 기록되어 있으며 저작권은 각 권리자에게 있습니다.

[HAS를 시작하며](https://velog.io/@noojoh/HAS%EB%A5%BC-%EC%8B%9C%EC%9E%91%ED%95%98%EB%A9%B0)
