export const IDENTITY_CONSENT_VERSION = "2026-09-20";
export const identityReady =
  import.meta.env.VITE_IDENTITY_VERIFICATION_READY === "true";
export type IdentityStatus = {
  status: string;
  nationality_codes: string[];
  updated_at: string;
};
export function safeVerificationUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === "https://verify.didit.me" &&
      !url.username &&
      !url.password &&
      /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?session\/[A-Za-z0-9_-]+$/.test(
        url.pathname,
      )
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export const identityMessages: Record<string, string> = {
  creating: "인증 화면을 준비하고 있어요. 잠시 후 다시 확인해주세요.",
  pending: "인증을 진행한 뒤 결과를 확인해주세요.",
  in_review:
    "인증 업체에서 확인하고 있어요. 완료되면 결과를 다시 확인해주세요.",
  needs_review:
    "본인과 국적을 모두 확인하지 못했어요. 국적이 기재된 유효한 여권으로 다시 시도해주세요.",
  declined:
    "인증을 완료하지 못했어요. 유효한 여권과 본인의 얼굴로 다시 시도해주세요.",
  expired: "인증이 만료됐어요. 댓글을 남기려면 다시 인증해주세요.",
  test_only:
    "테스트 인증을 마쳤어요. 실제 본인·국적 인증이나 댓글 권한은 부여되지 않아요.",
  withdrawn:
    "국적 공개 동의를 철회했어요. 기존 댓글은 숨겨졌고 국적 표시는 제거됐어요.",
};
export function identityError(code: unknown): string {
  if (code === "rate_limited")
    return "잠시 후 다시 시도해주세요. 인증 시작은 하루 3회까지 가능해요.";
  if (code === "monthly_limit")
    return "이번 달 무료 인증 한도에 도달했어요. 다음 달에 다시 이용해주세요.";
  if (code === "authentication_required")
    return "이메일 확인 후 다시 로그인해주세요.";
  if (code === "already_verified")
    return "이미 인증을 마쳤어요. 결과를 다시 확인해주세요.";
  if (code === "verification_not_ready")
    return "본인·국적 인증 서비스 연결을 준비하고 있어요.";
  return "인증 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요.";
}
