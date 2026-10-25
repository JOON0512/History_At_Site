import { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { supabase, nationalityLabel } from "../lib/community";
import type { Verification } from "../lib/community";
import {
  IDENTITY_CONSENT_VERSION,
  identityReady,
  identityMessages,
  identityError,
  safeVerificationUrl,
} from "../lib/identity";
import type { IdentityStatus } from "../lib/identity";

export default function IdentityVerification({
  verification,
  onChange,
}: {
  verification: Verification | null;
  onChange?: () => void;
}) {
  const [consent, setConsent] = useState(false);
  const [withdrawal, setWithdrawal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const verified =
    verification?.identity_verified && verification.nationality_verified;
  const load = async () => {
    if (!supabase || !identityReady) return;
    const { data, error } = await supabase.rpc("get_my_identity_status");
    if (error) throw new Error("status_unavailable");
    setStatus(data?.[0] ?? null);
  };
  useEffect(() => {
    let current = true;
    if (!identityReady || !supabase) return;
    void supabase.rpc("get_my_identity_status").then(({ data, error }) => {
      if (current && !error) setStatus(data?.[0] ?? null);
    });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  const act = async (action: "start" | "refresh") => {
    if (
      !supabase ||
      !identityReady ||
      busy ||
      cooldown ||
      (action === "start" && !consent)
    )
      return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    let errorMessage = identityError(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "identity-session",
        {
          body:
            action === "start"
              ? {
                  action,
                  consent: true,
                  consent_version: IDENTITY_CONSENT_VERSION,
                }
              : { action },
        },
      );
      if (error) {
        let code: unknown;
        if ("context" in error && error.context instanceof Response) {
          const result = await error.context.json().catch(() => ({}));
          code = result.error;
        }
        errorMessage = identityError(code);
        throw new Error("verification_failed");
      }
      if (action === "start" && data?.url) {
        const url = safeVerificationUrl(data.url);
        if (!url) throw new Error(identityError(null));
        window.location.assign(url);
        return;
      }
      await load();
      onChange?.();
      setCooldown(15);
      if (data?.status === "in_review") setMessage(identityMessages.in_review);
      else
        setMessage(
          "최신 인증 상태를 확인했어요. 아직 처리 중이면 잠시 후 다시 확인해주세요.",
        );
    } catch {
      setFailed(true);
      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  };
  const withdraw = async () => {
    if (!supabase || !withdrawal || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const { error } = await supabase.rpc("withdraw_identity_consent");
      if (error) throw error;
      setConsent(false);
      setWithdrawal(false);
      await load();
      onChange?.();
      setMessage(identityMessages.withdrawn);
    } catch {
      setFailed(true);
      setMessage("동의를 철회하지 못했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="identity-verification" aria-label="본인·국적 인증">
      <div className="identity-heading">
        <ShieldCheck size={20} />
        <h3>본인·국적 인증</h3>
      </div>
      <p className="identity-current">
        본인 확인: {verification?.identity_verified ? "완료" : "대기"}
        <br />
        국적 확인: {verification?.nationality_verified ? "완료" : "대기"}
      </p>
      {!identityReady ? (
        <p>
          인증 서비스 연결을 준비하고 있어요. 이메일 로그인만으로 댓글 인증이
          완료되지는 않습니다.
        </p>
      ) : (
        <>
          {verified ? (
            <p>
              여권에서 확인한 국적
              {status?.nationality_codes.length
                ? `: ${nationalityLabel(status.nationality_codes)}`
                : ""}
              <br />
              {verification?.can_comment
                ? "이제 영화와 장소에 관한 이야기를 남길 수 있어요."
                : "현재 댓글 참여 권한을 확인할 수 없어요."}
            </p>
          ) : (
            <>
              <p>
                여권과 본인의 얼굴로 인증해요. 국적이 기재된 유효한 여권을
                준비해주세요.
              </p>
              <p>
                인증된 국적은 프로필과 댓글에 표시됩니다. 이번에 제출한 여권의
                국적만 확인하며, 다른 국적을 추측해 추가하지 않아요.
              </p>
              <details>
                <summary>인증 정보와 국적 공개 안내</summary>
                <p>
                  여권과 얼굴 정보는 Didit이 처리·보관합니다. HAS는 원본
                  사진·여권 번호·실명을 보관하지 않고 인증 결과, 국적, 확인·만료
                  시각과 중복 서류 확인용 식별값을 보관해요.
                </p>
                <p>
                  국적 공개 동의를 철회하면 댓글 작성이 중단되고, 기존 댓글을
                  숨기며 국적 표시를 제거해요. Didit에 남은 원본 정보의 삭제는
                  해당 업체의 개인정보 요청 절차를 이용할 수 있어요.
                </p>
                <a
                  href="https://didit.me/terms/privacy-policy/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Didit 개인정보처리방침 <ExternalLink size={13} />
                </a>
              </details>
              <details lang="en">
                <summary>Identity verification · English 안내</summary>
                <p>
                  Verify your identity using a valid passport and your face.
                  Your verified nationality will be public on your profile and
                  comments. We use the nationality recorded in your passport; we
                  do not infer other citizenships.
                </p>
                <p>
                  Didit processes and stores your passport images and facial
                  information. HAS stores the verification result, nationality,
                  consent and validity dates, and a keyed identifier used to
                  detect reuse of the same passport. HAS does not store your
                  passport images, passport number, or legal name.
                </p>
                <p>
                  Withdrawing consent stops comment participation, hides your
                  existing comments and removes their nationality labels.
                  Re-verifying does not restore those comments automatically.
                  Requests to delete originals held by Didit follow Didit’s
                  privacy procedures. The verification page uses your browser’s
                  language when supported.
                </p>
                <a
                  href="https://didit.me/terms/privacy-policy/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Didit privacy policy <ExternalLink size={13} />
                </a>
              </details>
              {status && identityMessages[status.status] && (
                <p className="identity-state">
                  {identityMessages[status.status]}
                </p>
              )}
              {status?.status !== "in_review" && (
                <>
                  <label className="identity-consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      disabled={busy}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>
                      Didit의 본인 확인 절차와 확인된 국적의 프로필·댓글 공개에
                      동의합니다.
                      <small lang="en">
                        I consent to identity verification by Didit and public
                        display of my verified nationality on my profile and
                        comments.
                      </small>
                    </span>
                  </label>
                  <button
                    className="primary-button"
                    disabled={!consent || busy || cooldown > 0}
                    onClick={() => void act("start")}
                  >
                    {busy
                      ? "연결 중…"
                      : status?.status === "pending"
                        ? "인증 이어가기"
                        : "Didit에서 인증하기"}{" "}
                    <ExternalLink size={15} />
                    <span lang="en">Verify identity</span>
                  </button>
                </>
              )}
            </>
          )}
          <button
            className="text-button"
            disabled={busy || cooldown > 0}
            onClick={() => void act("refresh")}
          >
            {cooldown
              ? `${cooldown}초 후 결과 다시 확인`
              : "인증 결과 다시 확인"}
          </button>
          {(verified ||
            (status && !["withdrawn", "failed"].includes(status.status))) && (
            <details className="identity-withdraw">
              <summary>국적 공개 동의 철회 / Withdraw consent</summary>
              <p>
                기존 댓글은 숨겨지고 국적 표시가 제거돼요. 다시 인증하더라도
                기존 댓글은 자동으로 공개되지 않습니다.
              </p>
              <p lang="en">
                Your existing comments will be hidden and their nationality
                labels removed. Re-verifying will not make them public again.
              </p>
              <label className="identity-consent">
                <input
                  type="checkbox"
                  checked={withdrawal}
                  onChange={(e) => setWithdrawal(e.target.checked)}
                  disabled={busy}
                />
                <span>
                  안내를 확인했고 국적 공개 동의를 철회합니다.
                  <small lang="en">
                    I understand and withdraw consent to public display of my
                    nationality.
                  </small>
                </span>
              </label>
              <button
                className="text-button"
                disabled={!withdrawal || busy}
                onClick={() => void withdraw()}
              >
                동의 철회하기 / Withdraw consent
              </button>
            </details>
          )}
        </>
      )}
      {message && (
        <p
          className={failed ? "form-error" : "identity-state"}
          role={failed ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
