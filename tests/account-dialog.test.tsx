// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import AccountDialog from "../src/components/AccountDialog";

const auth = vi.hoisted(() => ({
  emailDeliveryReady: true,
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  resend: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../src/lib/community", () => ({
  get emailDeliveryReady() {
    return auth.emailDeliveryReady;
  },
  supabase: {
    auth,
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { display_name: "여행자" },
            error: null,
          }),
        }),
      }),
    }),
  },
}));
const baseProps = {
  session: null,
  verification: null,
  recovery: false,
  authLoading: false,
  onRecoveryDone: vi.fn(),
  onClose: vi.fn(),
};
const session = {
  user: { id: "test-user", email: "reader@example.com" },
} as Session;
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });
const submit = () => fireEvent.submit(document.querySelector("form")!);

beforeEach(() => {
  vi.clearAllMocks();
  auth.emailDeliveryReady = true;
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function () {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function () {
      this.removeAttribute("open");
    },
  });
});
afterEach(cleanup);

describe("email account dialog", () => {
  it("keeps login available but blocks mail-dependent flows until delivery is ready", () => {
    auth.emailDeliveryReady = false;
    render(<AccountDialog {...baseProps} />);
    expect(document.querySelector("fieldset")?.disabled).toBe(false);
    fireEvent.click(
      screen.getByRole("button", { name: "회원가입", exact: true }),
    );
    expect(document.querySelector("fieldset")?.disabled).toBe(true);
    submit();
    expect(auth.signUp).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "로그인", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "비밀번호를 잊으셨나요?" }),
    );
    expect(document.querySelector("fieldset")?.disabled).toBe(true);
    submit();
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("requires matching passwords and awaits email confirmation rather than claiming a session", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    render(<AccountDialog {...baseProps} />);
    fireEvent.click(
      screen.getByRole("button", { name: "회원가입", exact: true }),
    );
    change("이메일", "reader@example.com");
    change("비밀번호", "a-long-password");
    change("비밀번호 확인", "a-different-password");
    submit();
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("일치하지");
    change("비밀번호 확인", "a-long-password");
    submit();
    await screen.findByRole("heading", { name: "받은 편지함을 확인해주세요." });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "a-long-password",
      options: { emailRedirectTo: `${window.location.origin}/?auth=confirm` },
    });
    expect(screen.queryByLabelText("비밀번호", { exact: true })).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "60초 후 다시 요청",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.queryByText("나의 여행자 계정")).toBeNull();
  });
  it("recovers from a failed login request and never reflects private error detail", async () => {
    auth.signInWithPassword.mockRejectedValue(
      new Error("private server details"),
    );
    render(<AccountDialog {...baseProps} />);
    change("이메일", "reader@example.com");
    change("비밀번호", "password");
    submit();
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).not.toContain(
      "private server details",
    );
    expect(
      (screen.getByLabelText("비밀번호", { exact: true }) as HTMLInputElement)
        .disabled,
    ).toBe(false);
    expect(document.querySelector("fieldset")?.disabled).toBe(false);
  });
  it("allows an unconfirmed user to request a fresh signup email", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { code: "email_not_confirmed" },
    });
    auth.resend.mockResolvedValue({ error: null });
    render(<AccountDialog {...baseProps} />);
    change("이메일", "reader@example.com");
    change("비밀번호", "password");
    submit();
    fireEvent.click(
      await screen.findByRole("button", { name: "가입 확인 메일 다시 받기" }),
    );
    await waitFor(() =>
      expect(auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "reader@example.com",
        options: { emailRedirectTo: `${window.location.origin}/?auth=confirm` },
      }),
    );
  });
  it("does not expose whether a password-reset email belongs to an account", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    render(<AccountDialog {...baseProps} />);
    fireEvent.click(
      screen.getByRole("button", { name: "비밀번호를 잊으셨나요?" }),
    );
    change("이메일", "reader@example.com");
    submit();
    await screen.findByText(/가입된 이메일이라면 재설정 링크가 도착해요/);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "reader@example.com",
      { redirectTo: `${window.location.origin}/?auth=reset` },
    );
  });
  it("requires an authenticated session before offering a new password form", () => {
    render(<AccountDialog {...baseProps} recovery />);
    expect(screen.queryByLabelText("새 비밀번호", { exact: true })).toBeNull();
    expect(
      screen.getByRole("button", { name: "재설정 메일 다시 받기" }),
    ).toBeTruthy();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("updates the recovered account password and keeps identity verification separate", async () => {
    auth.updateUser.mockResolvedValue({ error: null });
    const onRecoveryDone = vi.fn();
    const { rerender } = render(
      <AccountDialog
        {...baseProps}
        session={session}
        recovery
        onRecoveryDone={onRecoveryDone}
      />,
    );
    change("새 비밀번호", "a-new-password");
    change("비밀번호 확인", "a-new-password");
    submit();
    await waitFor(() => expect(onRecoveryDone).toHaveBeenCalledOnce());
    expect(auth.updateUser).toHaveBeenCalledWith({
      password: "a-new-password",
    });
    rerender(
      <AccountDialog
        {...baseProps}
        session={session}
        onRecoveryDone={onRecoveryDone}
      />,
    );
    await screen.findByRole("heading", { name: "나의 여행자 계정" });
    expect(screen.getByText(/본인 확인:/).textContent).toContain("대기");
    expect(screen.getByText(/국적 확인:/).textContent).toContain("대기");
  });
});
