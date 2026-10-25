export type AuthAction = "login" | "signup" | "reset" | "update" | "resend";

export function passwordError(
  password: string,
  confirmation?: string,
): string | null {
  if (password.length < 8) return "비밀번호는 8자 이상으로 입력해주세요.";
  if (new TextEncoder().encode(password).length > 72)
    return "비밀번호가 너무 길어요. 영문 72자 또는 한글 24자 이내로 입력해주세요.";
  if (confirmation !== undefined && password !== confirmation)
    return "두 비밀번호가 일치하지 않아요.";
  return null;
}

export function authErrorMessage(error: unknown, action: AuthAction): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(code))
    return "요청이 많아 잠시 쉬고 있어요. 잠시 후 다시 시도해주세요.";
  if (code === "email_not_confirmed")
    return "받은 편지함의 가입 확인 링크를 먼저 눌러주세요.";
  if (code === "invalid_credentials")
    return "이메일 또는 비밀번호를 확인해주세요.";
  if (code === "weak_password")
    return "더 안전한 비밀번호를 사용해주세요. 길이를 늘리고 문자와 숫자를 섞어보세요.";
  if (code === "same_password") return "이전과 다른 비밀번호를 입력해주세요.";
  if (
    ["otp_expired", "flow_state_expired", "flow_state_not_found"].includes(code)
  )
    return "링크가 만료되었거나 이미 사용됐어요. 메일을 다시 요청해주세요.";
  if (
    [
      "email_address_not_authorized",
      "email_provider_disabled",
      "signup_disabled",
    ].includes(code)
  )
    return "이메일 가입 서비스를 준비하고 있어요. 조금 뒤에 다시 방문해주세요.";
  if (["user_already_exists", "email_exists"].includes(code))
    return "이 이메일로 가입을 진행할 수 없어요. 로그인 또는 비밀번호 재설정을 이용해주세요.";
  const messages: Record<AuthAction, string> = {
    login: "로그인하지 못했어요. 연결을 확인하고 다시 시도해주세요.",
    signup: "가입을 진행하지 못했어요. 잠시 후 다시 시도해주세요.",
    reset: "재설정 메일을 요청하지 못했어요. 잠시 후 다시 시도해주세요.",
    update: "비밀번호를 변경하지 못했어요. 재설정 메일을 다시 요청해주세요.",
    resend: "가입 확인 메일을 요청하지 못했어요. 잠시 후 다시 시도해주세요.",
  };
  return messages[action];
}

export function readAuthReturn(href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  return {
    recovery:
      url.searchParams.get("auth") === "reset" ||
      hash.get("type") === "recovery",
    confirmation: url.searchParams.get("auth") === "confirm",
    error:
      url.searchParams.has("error") ||
      hash.has("error") ||
      hash.has("error_code"),
  };
}

export function authReturnUrl(origin: string, intent: "confirm" | "reset") {
  const url = new URL("/", origin);
  url.searchParams.set("auth", intent);
  return url.href;
}

export function clearAuthReturn() {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  const hash = new URLSearchParams(url.hash.slice(1));
  if (hash.has("error") || hash.has("error_code")) url.hash = "";
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}
