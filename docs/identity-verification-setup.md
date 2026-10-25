# Didit 본인·국적 인증 연결

서버·화면·DB 권한 구현을 포함한 개발용 연결 안내입니다. `DIDIT_ENABLED`와 `VITE_IDENTITY_VERIFICATION_READY`는 기본 false이며, 자신의 공급자 계정과 환경에서 통합 검증한 뒤 활성화해야 합니다. 개인 계정의 콘솔 설정·실제 워크플로·운영 키 상태는 포함하지 않습니다.

## 업체 설정

1. 자신의 Didit 계정과 사용할 요금·처리 범위를 확인합니다.
2. 여권 ID verification, passive liveness, face match가 모두 필요한 워크플로를 만듭니다. 주민등록증·운전면허증의 발급국을 국적으로 간주하지 않습니다. 제출 문서에 국적이 없거나 공식 ISO 코드로 대응하지 않으면 미확인 상태로 남깁니다.
3. 무료 사용량과 지원 문서, 데이터 보관·학습 사용 설정을 실제 콘솔에서 확인합니다. HAS는 원본을 저장하지 않지만 업체의 보관 정책은 별개입니다.
4. API 키와 워크플로 ID, 웹훅 서명 비밀값을 준비해 Supabase Edge Function Secrets에만 저장합니다. 공개 저장소·화면·VITE 환경변수에 넣지 않습니다.
5. 웹훅 수신 주소를 다음과 같이 별도로 등록합니다. 사용자 복귀 callback 주소와 다릅니다.

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/didit-webhook
```

`status.updated`와 `data.updated` 이벤트를 연결합니다. 공식 V2 서명을 이용하며 전체 본문의 서명과 타임스탬프를 검사합니다. `X-Signature-Simple`은 사용하지 않습니다.

## 서버 설정

`supabase/functions/.env.example`의 이름으로 Edge Function Secrets를 설정합니다. `supabase/functions/_shared/settings.ts`의 `allowedOrigins` 예시 도메인 `https://has.example`도 자신의 서비스 Origin으로 바꿉니다.

- `DIDIT_API_KEY`: 업체 API 키
- `DIDIT_WORKFLOW_ID`: 정확한 여권·얼굴 인증 워크플로 UUID
- `DIDIT_WEBHOOK_SECRET`: 이 수신 주소의 웹훅 서명 비밀값
- `IDENTITY_SUBJECT_HASH_KEY`: 별도로 생성한 32바이트 이상의 임의 비밀값. 동일 여권 중복 확인에 사용하므로 계획 없이 교체하지 않습니다.
- `DIDIT_ENABLED`: 연결 검증 때만 true

Supabase 서버 키는 런타임이 제공하는 `SUPABASE_SECRET_KEYS.default` 또는 기존 `SUPABASE_SERVICE_ROLE_KEY`를 사용합니다. 직접 브라우저에 전달하지 않습니다. `identity-session`은 JWT 확인을 유지하며 서버에서도 `/auth/v1/user`로 사용자와 이메일 확인을 재검증합니다. 외부 웹훅만 JWT 대신 전체 본문 HMAC으로 인증합니다.

CLI 재배포 시 `supabase/config.toml`의 함수별 JWT 설정을 유지합니다. 이미 적용한 DB 마이그레이션은 재적용하지 않습니다.

## 공개 전 검증

- 로그인하지 않거나 이메일 확인 전이면 인증 요청 거부
- 동의하지 않으면 인증 시작 불가, 임의 사용자 ID 무시
- 실제 여권·얼굴 확인 후 해당 여권의 nationality만 국적으로 반영
- 샌드박스, 서명 위조, 세션 바꿔치기, 누락된 얼굴 검사, 국적 누락은 댓글 권한을 부여하지 않음
- 중복·역순 웹훅, 인증 중 동의 철회와 지연 응답을 처리
- 인증된 국적이 댓글에 표시되고 동의 철회 후 기존 댓글 숨김·국적 제거·작성 차단
- 다른 여권이나 갱신된 여권을 통한 동일인 판별은 보장하지 않음을 구분
- 실제 성공·실패·만료·철회 및 모바일 인증 복귀 확인

원격 프로젝트에는 가짜 신원 확인 결과를 넣지 않습니다. 브라우저 콜백의 `status`는 권한 근거로 쓰지 않습니다. 연결 검증 후에만 `VITE_IDENTITY_VERIFICATION_READY=true`로 다시 빌드·배포합니다.

## 비용과 운영

코드에는 UTC 월 450회 신규 시도 제한이 있습니다. 콘솔에서 직접 만든 세션이나 다른 앱의 이용량은 포함하지 않으며, 업체 과금 차단을 대체하지 않습니다. 실제 계정의 요금과 사용량은 공급자 콘솔에서 확인해야 합니다.

웹훅에서는 결과를 다시 조회한 후 응답합니다. 업체 응답 지연 시 재시도가 발생할 수 있으며 이벤트 ID로 중복 처리를 막습니다. 계정 화면의 결과 재확인도 제공합니다. 원본 응답을 로그에 남기지 않습니다.

공식 참고: [세션 생성](https://docs.didit.me/sessions-api/create-session), [결과 조회](https://docs.didit.me/sessions-api/retrieve-session), [웹훅](https://docs.didit.me/integration/webhooks), [요금](https://didit.me/pricing/), [개인정보처리방침](https://didit.me/terms/privacy-policy/).
