import { describe, expect, it } from "vitest";
import {
  authErrorMessage,
  authReturnUrl,
  passwordError,
  readAuthReturn,
} from "./auth";

describe("email account flow", () => {
  it("distinguishes recovery, confirmation, and rejected links without exposing tokens", () => {
    expect(readAuthReturn("https://has.test/?auth=reset")).toEqual({
      recovery: true,
      confirmation: false,
      error: false,
    });
    expect(
      readAuthReturn(
        "https://has.test/?auth=confirm#access_token=secret&type=signup",
      ),
    ).toEqual({ recovery: false, confirmation: true, error: false });
    expect(
      readAuthReturn(
        "https://has.test/#error=access_denied&error_code=otp_expired",
      ).error,
    ).toBe(true);
    expect(
      readAuthReturn("https://has.test/#access_token=secret&type=recovery")
        .recovery,
    ).toBe(true);
    expect(
      JSON.stringify(readAuthReturn("https://has.test/#access_token=secret")),
    ).not.toContain("secret");
  });
  it("returns email links to this site's root with only the expected intent", () => {
    expect(
      authReturnUrl("https://has.example", "reset"),
    ).toBe("https://has.example/?auth=reset");
    expect(authReturnUrl("http://127.0.0.1:5173", "confirm")).toBe(
      "http://127.0.0.1:5173/?auth=confirm",
    );
  });
  it("rejects mismatches and bcrypt byte overflows without trimming a password", () => {
    expect(passwordError("short")).toBeTruthy();
    expect(passwordError("long-enough", "different")).toBeTruthy();
    expect(passwordError("가".repeat(25))).toBeTruthy();
    expect(passwordError("a".repeat(72))).toBeNull();
    expect(passwordError("  long phrase  ", "  long phrase  ")).toBeNull();
    expect(passwordError("  long phrase  ", "long phrase")).toBeTruthy();
  });
  it("shows safe actionable errors without reflecting server messages or email addresses", () => {
    expect(
      authErrorMessage(
        { code: "invalid_credentials", message: "private@example.com" },
        "login",
      ),
    ).toBe("이메일 또는 비밀번호를 확인해주세요.");
    expect(
      authErrorMessage({ code: "email_not_confirmed" }, "login"),
    ).toContain("가입 확인");
    expect(
      authErrorMessage({ code: "over_email_send_rate_limit" }, "resend"),
    ).toContain("잠시 후");
    expect(
      authErrorMessage(new Error("secret infrastructure error"), "signup"),
    ).not.toContain("secret");
  });
});
