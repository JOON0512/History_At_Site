import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Mail, X } from "lucide-react";
import IdentityVerification from "./IdentityVerification";
import type { Session } from "@supabase/supabase-js";
import { emailDeliveryReady, supabase } from "../lib/community";
import type { Verification } from "../lib/community";
import { authErrorMessage, authReturnUrl, passwordError } from "../lib/auth";
import type { AuthAction } from "../lib/auth";

type Mode = "login" | "signup" | "forgot" | "update";

function PasswordField({
  id,
  label,
  value,
  onChange,
  isNew = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isNew?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={isNew ? "new-password" : "current-password"}
          minLength={isNew ? 8 : undefined}
          required
        />
        <button
          type="button"
          className="icon-button"
          aria-label={`${label} ${visible ? "숨기기" : "보기"}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  );
}

export default function AccountDialog({
  session,
  verification,
  recovery,
  authLoading,
  onRecoveryDone,
  onVerificationChanged,
  onClose,
}: {
  session: Session | null;
  verification: Verification | null;
  recovery: boolean;
  authLoading: boolean;
  onRecoveryDone: () => void;
  onVerificationChanged?: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>(recovery ? "update" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [hasError, setHasError] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const showAccount = !!session && !recovery && mode !== "update";
  const unavailable = !supabase;
  const formUnavailable =
    unavailable ||
    (!emailDeliveryReady && (mode === "signup" || mode === "forgot"));

  useEffect(() => {
    const el = dialog.current!;
    if (!el.open) el.showModal();
    return () => el.close();
  }, []);
  useEffect(() => {
    if (recovery) setMode("update");
  }, [recovery]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    setPassword("");
    setConfirmation("");
  }, [session?.user.id]);
  useEffect(() => {
    if (!session || !supabase) return;
    const client = supabase;
    let active = true;
    setProfileReady(false);
    void (async () => {
      try {
        const { data, error } = await client
          .from("profiles")
          .select("display_name")
          .eq("id", session.user.id)
          .single();
        if (!active) return;
        if (error || !data) throw error;
        setDisplayName(data.display_name);
        setProfileReady(true);
      } catch {
        if (active) {
          setStatus("계정은 연결됐지만 닉네임을 불러오지 못했어요.");
          setHasError(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.user.id, profileAttempt]);

  const changeMode = (next: Mode) => {
    if (busy) return;
    setMode(next);
    setStatus("");
    setHasError(false);
    setPassword("");
    setConfirmation("");
    setCheckInbox(false);
    if (recovery) onRecoveryDone();
  };
  const notify = (message: string, error = false) => {
    setStatus(message);
    setHasError(error);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || formUnavailable || busy || authLoading) return;
    if (mode === "update" && !session) return;
    if (mode === "signup" || mode === "update") {
      const invalid = passwordError(password, confirmation);
      if (invalid) {
        notify(invalid, true);
        return;
      }
    }
    setBusy(true);
    notify("");
    const action: AuthAction = mode === "forgot" ? "reset" : mode;
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setPassword("");
        notify("로그인했어요. 반가워요!");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: authReturnUrl(window.location.origin, "confirm"),
          },
        });
        if (error) throw error;
        setPassword("");
        setConfirmation("");
        if (data.session) {
          notify("가입이 완료됐어요.");
        } else {
          setCheckInbox(true);
          setCooldown(60);
          notify(
            "메일함에서 가입 확인 링크를 눌러주세요. 이미 가입한 주소라면 로그인 또는 비밀번호 재설정을 이용해주세요.",
          );
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: authReturnUrl(window.location.origin, "reset"),
          },
        );
        if (error) throw error;
        setCooldown(60);
        notify(
          "가입된 이메일이라면 재설정 링크가 도착해요. 받은 편지함과 스팸함을 확인해주세요.",
        );
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword("");
        setConfirmation("");
        onRecoveryDone();
        setMode("login");
        notify("비밀번호를 변경했어요.");
      }
    } catch (error) {
      if (
        mode === "login" &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "email_not_confirmed"
      ) {
        setPassword("");
        setCheckInbox(true);
      }
      notify(authErrorMessage(error, action), true);
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    if (!supabase || !emailDeliveryReady || busy || cooldown) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: authReturnUrl(window.location.origin, "confirm"),
        },
      });
      if (error) throw error;
      setCooldown(60);
      notify(
        "가입 확인이 필요한 이메일이라면 새 링크가 도착해요. 가장 최근에 받은 메일을 열어주세요.",
      );
    } catch (error) {
      notify(authErrorMessage(error, "resend"), true);
    } finally {
      setBusy(false);
    }
  };
  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !session || busy || !profileReady) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 30) {
      notify("닉네임은 2–30자로 입력해주세요.", true);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ display_name: name })
        .eq("id", session.user.id)
        .select("display_name")
        .single();
      if (error || !data) throw error;
      setDisplayName(data.display_name);
      notify("닉네임을 저장했어요.");
    } catch {
      notify("닉네임을 저장하지 못했어요. 다시 시도해주세요.", true);
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      onRecoveryDone();
      onClose();
    } catch {
      notify("로그아웃하지 못했어요. 다시 시도해주세요.", true);
    } finally {
      setBusy(false);
    }
  };
  const titles: Record<Mode, string> = {
    login: "다시, 영화 속 세계로.",
    signup: "함께, 더 넓은 시선으로.",
    forgot: "비밀번호를 잊으셨나요?",
    update: "새 비밀번호를 정해주세요.",
  };
  return (
    <dialog
      className="account-dialog"
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      aria-labelledby="account-title"
    >
      <div className="dialog-inner">
        <button
          className="dialog-close icon-button"
          aria-label="로그인 창 닫기"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">HISTORY AT SITE</span>
        <h2 id="account-title">
          {showAccount
            ? "나의 여행자 계정"
            : checkInbox
              ? "받은 편지함을 확인해주세요."
              : titles[mode]}
        </h2>
        {unavailable && (
          <p className="auth-service-note" role="status">
            이메일 계정 서비스 연결을 준비하고 있어요. 지금은 입력 정보가
            전송되지 않습니다.
          </p>
        )}
        {!unavailable && !emailDeliveryReady && !showAccount && (
          <p className="auth-service-note" role="status">
            회원가입과 비밀번호 재설정은 아직 준비 중이에요. 기존 계정으로는
            로그인할 수 있어요.
          </p>
        )}
        {authLoading ? (
          <p role="status">로그인 상태를 확인하고 있어요…</p>
        ) : showAccount ? (
          <>
            <div className="account-identity">
              <Mail size={18} />
              <span>{session.user.email}</span>
            </div>
            <form onSubmit={saveName}>
              <label htmlFor="display-name">공개 닉네임</label>
              <input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="nickname"
                minLength={2}
                maxLength={30}
                required
                disabled={!profileReady || busy}
              />
              <button
                className="primary-button"
                disabled={busy || !profileReady}
              >
                닉네임 저장
              </button>
            </form>
            {!profileReady && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setProfileAttempt((value) => value + 1)}
              >
                닉네임 다시 불러오기
              </button>
            )}
            <IdentityVerification
              verification={verification}
              onChange={onVerificationChanged}
            />
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void signOut()}
            >
              {busy ? "처리 중…" : "로그아웃"}
            </button>
          </>
        ) : checkInbox ? (
          <>
            <Mail className="dialog-symbol" size={32} />
            <p className="auth-email">{email}</p>
            <p>
              확인 후 이 사이트로 돌아와요. 메일이 보이지 않으면 스팸함도
              확인해주세요.
            </p>
            <button
              className="primary-button"
              disabled={
                busy || cooldown > 0 || unavailable || !emailDeliveryReady
              }
              onClick={() => void resend()}
            >
              {busy
                ? "요청 중…"
                : cooldown
                  ? `${cooldown}초 후 다시 요청`
                  : "가입 확인 메일 다시 받기"}
            </button>
            <div className="auth-links">
              <button
                className="text-button"
                disabled={busy}
                onClick={() => changeMode("signup")}
              >
                이메일 수정
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => changeMode("login")}
              >
                로그인으로 돌아가기
              </button>
            </div>
          </>
        ) : mode === "update" && !session ? (
          <>
            <p>
              재설정 링크가 만료되었거나 로그인 상태를 확인할 수 없어요. 메일을
              다시 요청해주세요.
            </p>
            <button
              className="primary-button"
              onClick={() => changeMode("forgot")}
            >
              재설정 메일 다시 받기
            </button>
          </>
        ) : (
          <>
            {(mode === "login" || mode === "signup") && (
              <div
                className="auth-mode-switch"
                role="group"
                aria-label="로그인 또는 회원가입"
              >
                <button
                  type="button"
                  aria-pressed={mode === "login"}
                  disabled={busy}
                  onClick={() => changeMode("login")}
                >
                  로그인
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "signup"}
                  disabled={busy}
                  onClick={() => changeMode("signup")}
                >
                  회원가입
                </button>
              </div>
            )}
            <p>
              {mode === "signup"
                ? "이메일을 확인한 뒤, 나만의 계정으로 여행을 이어가세요."
                : mode === "forgot"
                  ? "가입한 이메일로 비밀번호 재설정 링크를 보내드려요."
                  : mode === "update"
                    ? "다음 로그인에 사용할 비밀번호를 입력해주세요."
                    : "이메일과 비밀번호로 로그인하세요."}
            </p>
            <form onSubmit={submit} aria-busy={busy}>
              <fieldset disabled={busy || formUnavailable}>
                {mode !== "update" && (
                  <>
                    <label htmlFor="email-address">이메일</label>
                    <input
                      id="email-address"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </>
                )}
                {mode !== "forgot" && (
                  <PasswordField
                    id="account-password"
                    label={mode === "update" ? "새 비밀번호" : "비밀번호"}
                    value={password}
                    onChange={setPassword}
                    isNew={mode !== "login"}
                  />
                )}
                {(mode === "signup" || mode === "update") && (
                  <>
                    <p className="password-hint">
                      8자 이상 · 길고 고유한 비밀번호를 사용해주세요.
                    </p>
                    <PasswordField
                      id="confirm-password"
                      label="비밀번호 확인"
                      value={confirmation}
                      onChange={setConfirmation}
                      isNew
                    />
                  </>
                )}
                <button
                  className="primary-button"
                  disabled={mode === "forgot" && cooldown > 0}
                >
                  {busy
                    ? "처리 중…"
                    : mode === "login"
                      ? "로그인"
                      : mode === "signup"
                        ? "가입 확인 메일 받기"
                        : mode === "update"
                          ? "새 비밀번호 저장"
                          : cooldown
                            ? `${cooldown}초 후 다시 요청`
                            : "재설정 메일 받기"}
                </button>
              </fieldset>
            </form>
            {mode === "login" && (
              <button
                className="text-button auth-forgot"
                disabled={busy}
                onClick={() => changeMode("forgot")}
              >
                비밀번호를 잊으셨나요?
              </button>
            )}
            {mode === "forgot" && (
              <button
                className="text-button auth-forgot"
                disabled={busy}
                onClick={() => changeMode("login")}
              >
                로그인으로 돌아가기
              </button>
            )}
            {(mode === "login" || mode === "signup") && (
              <p className="privacy-note">
                이메일은 공개되지 않습니다. 댓글 참여에는 별도의 본인·국적
                인증이 필요하며, 인증된 국적은 댓글과 함께 표시됩니다.
              </p>
            )}
          </>
        )}
        {status && (
          <p
            className={`form-status ${hasError ? "form-error" : ""}`}
            role={hasError ? "alert" : "status"}
          >
            {status}
          </p>
        )}
      </div>
    </dialog>
  );
}
