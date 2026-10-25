import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Flag,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { Film } from "../data/films";
import {
  canParticipate,
  nationalityLabel,
  safeSourceUrl,
  supabase,
  validateComment,
} from "../lib/community";
import type { Comment, Verification } from "../lib/community";

type Props = {
  film: Film;
  session: Session | null;
  verification: Verification | null;
  onLogin: () => void;
};

export default function Community({
  film,
  session,
  verification,
  onLogin,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const allowed = canParticipate(verification);
  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setFailed(false);
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id,author_id,author_nationality_codes,body,source_url,spoiler,created_at,profiles(display_name)",
      )
      .eq("film_id", film.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      setFailed(true);
      setStatus("이야기를 불러오지 못했어요. 다시 시도해주세요.");
    } else setComments((data ?? []) as unknown as Comment[]);
    setLoading(false);
  }, [film.id]);
  useEffect(() => {
    void load();
  }, [load, session?.user.id, allowed]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !session || !allowed || submitting) return;
    const invalid = validateComment(body, source);
    if (invalid) {
      setStatus(invalid);
      return;
    }
    setSubmitting(true);
    setStatus("");
    const { error } = await supabase.from("comments").insert({
      film_id: film.id,
      author_id: session.user.id,
      body: body.trim(),
      source_url: safeSourceUrl(source),
      spoiler,
    });
    if (error) setStatus("등록하지 못했어요. 인증 상태와 연결을 확인해주세요.");
    else {
      setBody("");
      setSource("");
      setSpoiler(false);
      setStatus("이야기를 남겼어요.");
      await load();
    }
    setSubmitting(false);
  };
  const remove = async (id: string) => {
    if (!supabase || !window.confirm("이 댓글을 삭제할까요?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) setStatus("삭제하지 못했어요. 다시 시도해주세요.");
    else {
      setStatus("댓글을 삭제했어요.");
      await load();
    }
  };
  const report = async (id: string) => {
    if (!supabase || !session || !allowed) {
      onLogin();
      return;
    }
    const reason = window.prompt("신고 이유를 적어주세요. (5–500자)");
    if (reason === null) return;
    if (reason.trim().length < 5 || reason.trim().length > 500) {
      setStatus("신고 이유를 5–500자로 입력해주세요.");
      return;
    }
    const { error } = await supabase.from("comment_reports").insert({
      comment_id: id,
      reporter_id: session.user.id,
      reason: reason.trim(),
    });
    setStatus(
      error
        ? error.code === "23505"
          ? "이미 신고한 댓글이에요."
          : "신고를 접수하지 못했어요."
        : "신고를 접수했어요.",
    );
  };

  return (
    <div className="community-content">
      <div className="conversation-prompt">
        <MessageCircle size={19} />
        <p>{film.question}</p>
      </div>
      <p className="community-guidance">
        감상은 자유롭게, 사실에 관한 설명에는 출처를 함께. 서로의 국적이나
        정체성을 공격하는 말은 삼가주세요.
      </p>
      {!supabase ? (
        <div className="community-gate">
          <ShieldCheck size={25} />
          <h3>이야기를 나눌 공간을 준비하고 있어요</h3>
          <p>로그인과 본인·국적 인증 서비스 연결 후 댓글을 남길 수 있어요.</p>
          <span className="status-tag">커뮤니티 오픈 준비 중</span>
        </div>
      ) : !session ? (
        <div className="community-gate">
          <ShieldCheck size={24} />
          <h3>나의 시선도 남겨보세요</h3>
          <p>로그인하고 본인·국적 인증을 마친 뒤 참여할 수 있어요.</p>
          <button className="primary-button" onClick={onLogin}>
            로그인하기
          </button>
        </div>
      ) : !allowed ? (
        <div className="community-gate">
          <ShieldCheck size={24} />
          <h3>참여 전 인증이 필요해요</h3>
          <p>
            본인 확인 {verification?.identity_verified ? "완료" : "대기"} · 국적
            확인 {verification?.nationality_verified ? "완료" : "대기"}
          </p>
          <p>인증된 국적은 댓글에 공개되며, 실명은 공개하지 않아요.</p>
          <button className="primary-button" onClick={onLogin}>
            본인·국적 인증 확인하기
          </button>
        </div>
      ) : (
        <form className="comment-form" onSubmit={submit}>
          <label htmlFor="comment-body">이 장소와 영화에 관한 이야기</label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="영화 속 풍경, 기억, 함께 읽을 자료를 나눠주세요."
            required
          />
          <label htmlFor="source-url">
            자료 링크 <span>(선택)</span>
          </label>
          <input
            id="source-url"
            type="url"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            maxLength={2048}
            placeholder="https://"
          />
          <div className="comment-form-footer">
            <label>
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
              />{" "}
              스포일러 포함
            </label>
            <span>{body.length}/2,000</span>
          </div>
          <button className="primary-button" disabled={submitting}>
            {submitting ? "남기는 중…" : "이야기 남기기"}
          </button>
        </form>
      )}
      {status && (
        <p className="form-status" role="status">
          {status}
        </p>
      )}
      {supabase && (
        <>
          <div className="comments-heading">
            <h3>
              이곳의 이야기{" "}
              <span>
                {comments.length}
                {comments.length === 50 ? "+" : ""}
              </span>
            </h3>
            <button
              className="icon-button"
              aria-label="댓글 새로고침"
              disabled={loading}
              onClick={() => void load()}
            >
              <RefreshCw size={15} />
            </button>
          </div>
          {loading ? (
            <p className="empty-copy" role="status">
              이야기를 불러오는 중…
            </p>
          ) : failed ? (
            <p className="empty-copy">새로고침을 눌러 다시 불러올 수 있어요.</p>
          ) : !comments.length ? (
            <p className="empty-copy">
              아직 이야기가 없어요. 첫 번째 시선을 남겨주세요.
            </p>
          ) : (
            comments.map((comment) => (
              <article className="comment" key={comment.id}>
                <div className="comment-meta">
                  <strong>{comment.profiles?.display_name || "여행자"}</strong>
                  <span title="댓글 작성 당시 인증된 국적">
                    <ShieldCheck size={13} />{" "}
                    {nationalityLabel(comment.author_nationality_codes)}
                  </span>
                </div>
                <time dateTime={comment.created_at}>
                  {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                </time>
                {comment.spoiler ? (
                  <details>
                    <summary>스포일러가 포함된 이야기 펼치기</summary>
                    <p className="comment-body">{comment.body}</p>
                  </details>
                ) : (
                  <p className="comment-body">{comment.body}</p>
                )}
                {comment.source_url && safeSourceUrl(comment.source_url) && (
                  <a
                    href={safeSourceUrl(comment.source_url)!}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                  >
                    함께 읽을 자료 <ExternalLink size={12} />
                  </a>
                )}
                <div className="comment-actions">
                  {session?.user.id === comment.author_id ? (
                    <button onClick={() => void remove(comment.id)}>
                      <Trash2 size={13} /> 삭제
                    </button>
                  ) : (
                    <button onClick={() => void report(comment.id)}>
                      <Flag size={13} /> 신고
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </>
      )}
    </div>
  );
}
