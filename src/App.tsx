import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircle,
  Search,
  UserRound,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { eras, films, filterFilms } from "./data/films";
import type { Era, Film, Place } from "./data/films";
import Globe from "./components/Globe";
import Community from "./components/Community";
import AccountDialog from "./components/AccountDialog";
import {
  initialAuthReturn,
  initialIdentityReturn,
  supabase,
} from "./lib/community";
import { clearAuthReturn } from "./lib/auth";
import type { Verification } from "./lib/community";

function Poster({ film, className = "" }: { film: Film; className?: string }) {
  const [failed, setFailed] = useState(false);
  return film.poster && !failed ? (
    <img
      className={className}
      src={film.poster}
      alt={`${film.title} 포스터`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span
      className={`poster-fallback ${className}`}
      aria-label={`${film.title} 작품 카드`}
    >
      <span className="poster-card-kicker">HAS · CINEMATIC ATLAS</span>
      <span className="poster-card-orbit" aria-hidden="true">
        ✳
      </span>
      <strong>{film.title}</strong>
      <small>{film.originalTitle}</small>
      <span className="poster-card-place">
        {film.places[0].country}
        <br />
        {film.release}
      </span>
    </span>
  );
}

export default function App() {
  const pageSize = 40;
  const [page, setPage] = useState(0);
  const filmList = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [era, setEra] = useState<Era | "all">("all");
  const [selectedId, setSelectedId] = useState("about-time");
  const [activePlace, setActivePlace] = useState("london");
  const [panelTab, setPanelTab] = useState<"story" | "community">("story");
  const [accountOpen, setAccountOpen] = useState(
    initialIdentityReturn ||
      initialAuthReturn.recovery ||
      initialAuthReturn.confirmation ||
      initialAuthReturn.error,
  );
  const [recovery, setRecovery] = useState(initialAuthReturn.recovery);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [session, setSession] = useState<Session | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [verificationRevision, setVerificationRevision] = useState(0);
  const [authNotice, setAuthNotice] = useState("");
  const filtered = useMemo(() => filterFilms(query, era), [query, era]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleFilms = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const selected = filtered.find((f) => f.id === selectedId) ?? filtered[0];
  const place =
    selected?.places.find((p) => p.id === activePlace) ?? selected?.places[0];
  const placesCount = new Set(films.flatMap((f) => f.places.map((p) => p.id)))
    .size;

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        setAccountOpen(true);
      }
      if (event === "SIGNED_OUT") setVerification(null);
    });
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        setSession(data.session);
        if (error || initialAuthReturn.error) {
          setAuthNotice(
            "이메일 링크가 만료되었거나 로그인 상태를 확인하지 못했어요. 메일을 다시 요청하거나 로그인해주세요.",
          );
        } else if (initialAuthReturn.confirmation && data.session) {
          setAuthNotice("이메일 확인을 마쳤어요. HAS에 오신 것을 환영해요!");
        }
        // Keep recovery intent across refresh until the password is changed.
        if (!initialAuthReturn.recovery || initialAuthReturn.error)
          clearAuthReturn();
      })
      .catch(() => {
        if (active)
          setAuthNotice(
            "로그인 상태를 확인하지 못했어요. 연결을 확인하고 다시 시도해주세요.",
          );
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const refresh = () => setVerificationRevision((value) => value + 1);
    window.addEventListener("focus", refresh);
    if (initialIdentityReturn) {
      const url = new URL(window.location.href);
      for (const key of ["identity", "verificationSessionId", "status"])
        url.searchParams.delete(key);
      window.history.replaceState(
        null,
        "",
        url.pathname + url.search + url.hash,
      );
    }
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => {
    setVerification(null);
    if (!supabase || !session) return;
    let active = true;
    void supabase.rpc("get_my_verification").then(({ data, error }) => {
      if (active && !error) setVerification(data?.[0] ?? null);
    });
    return () => {
      active = false;
    };
  }, [session, verificationRevision, accountOpen]);

  const selectFilm = (film: Film, nextPlace?: Place, reveal = false) => {
    setSelectedId(film.id);
    const index = filtered.findIndex((item) => item.id === film.id);
    if (index >= 0) setPage(Math.floor(index / pageSize));
    setActivePlace(nextPlace?.id ?? film.places[0]?.id ?? "");
    if (reveal && window.matchMedia("(max-width: 640px)").matches) {
      requestAnimationFrame(() => {
        document.querySelector(".programme")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        });
      });
    }
  };
  const resetFilters = () => {
    setQuery("");
    setEra("all");
    setPage(0);
  };
  const changePage = (next: number) => {
    setPage(next);
    filmList.current?.scrollTo?.({ top: 0 });
    filmList.current?.focus();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#film-list">
        작품 목록으로 건너뛰기
      </a>
      <header className="site-header">
        <button
          className="brand"
          aria-label="History At Site 처음으로"
          onClick={() => {
            resetFilters();
            selectFilm(films[0]);
            setPanelTab("story");
          }}
        >
          <span className="brand-mark">
            <Globe2 size={28} strokeWidth={1.1} />
          </span>
          <span>
            History At Site<small>A CINEMATIC ATLAS</small>
          </span>
        </button>
        <div className="header-middle">
          <span className="header-line" />
          <span>영화를 따라, 그곳으로.</span>
        </div>
        <button className="account-button" onClick={() => setAccountOpen(true)}>
          <UserRound size={17} />
          <span>
            {authLoading ? "확인 중…" : session ? "내 계정" : "로그인"}
          </span>
        </button>
      </header>
      {authNotice && (
        <div className="auth-notice" role="status">
          {authNotice}
          <button aria-label="알림 닫기" onClick={() => setAuthNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}
      <main className="explorer">
        <aside className="archive-sidebar" aria-label="영화 아카이브">
          <div className="archive-intro">
            <span className="eyebrow">THE GROWING COLLECTION</span>
            <h1>
              어떤 세계를
              <br />
              만나볼까요<span>?</span>
            </h1>
            <p>
              한 편의 영화, 하나의 장소.
              <br />
              그곳의 시간 속으로 들어가 보세요.
            </p>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input
              aria-label="영화, 장소, 시대 검색"
              placeholder="영화, 장소, 시대 찾기"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
            {query && (
              <button
                aria-label="검색어 지우기"
                onClick={() => {
                  setQuery("");
                  setPage(0);
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="collection-heading">
            <h2>영화 컬렉션</h2>
            <span aria-live="polite">
              {filtered.length.toString().padStart(2, "0")} FILMS
            </span>
          </div>
          <div
            className="film-list"
            id="film-list"
            tabIndex={-1}
            ref={filmList}
          >
            {filtered.length ? (
              visibleFilms.map((film) => (
                <button
                  className={`film-item ${selected?.id === film.id ? "active" : ""}`}
                  key={film.id}
                  onClick={() => selectFilm(film, undefined, true)}
                  aria-pressed={selected?.id === film.id}
                  style={{ "--film-color": film.color } as React.CSSProperties}
                >
                  <Poster film={film} className="film-thumb" />
                  <span className="film-item-info">
                    <strong>{film.title}</strong>
                    <span>
                      {film.pending
                        ? "다음 여정으로 담아두었어요"
                        : film.places[0].country + " · " + film.period}
                    </span>
                    <small>{film.originalTitle}</small>
                  </span>
                  <ChevronRight className="film-chevron" size={16} />
                </button>
              ))
            ) : (
              <div className="search-empty">
                <Compass size={25} />
                <p>아직 이곳의 영화가 없어요.</p>
                <button className="text-button" onClick={resetFilters}>
                  모든 작품 보기
                </button>
              </div>
            )}
          </div>
          {filtered.length > pageSize && (
            <nav
              className="collection-pagination"
              aria-label="영화 목록 페이지"
            >
              <button
                aria-label="이전 영화 목록"
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
              >
                이전
              </button>
              <span aria-live="polite">
                {page + 1} / {pageCount}
                <small>
                  {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, filtered.length)}편
                </small>
              </span>
              <button
                aria-label="다음 영화 목록"
                disabled={page + 1 === pageCount}
                onClick={() => changePage(page + 1)}
              >
                다음
              </button>
            </nav>
          )}
          <div className="collection-footer">
            <span className="small-spark">✳</span>
            <p>
              좋아하는 영화로
              <br />
              조금씩 넓어지는 세계.
            </p>
            <span>
              {films.length}편 · {placesCount}곳
            </span>
          </div>
        </aside>
        <div className="world-column">
          <Globe
            films={filtered}
            selected={selected}
            activePlace={place?.id}
            onSelect={(film, place) => selectFilm(film, place, true)}
          />
          <div className="timeline">
            <div className="timeline-label">
              <span>어느 시간으로</span>
              <ArrowDown size={15} />
            </div>
            <div className="era-options" aria-label="배경 시대 선택">
              {eras.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setEra(item.id);
                    setPage(0);
                  }}
                  className={era === item.id ? "active" : ""}
                  aria-pressed={era === item.id}
                >
                  <span className="era-tick" />
                  <small>{item.subtitle}</small>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <aside
          className="programme"
          aria-label="선택한 영화 프로그램북"
          aria-live="polite"
        >
          {selected ? (
            <>
              <div className="programme-heading">
                <span>YOUR NEXT DESTINATION</span>
                <span>
                  NO.{" "}
                  {String(
                    films.findIndex((f) => f.id === selected.id) + 1,
                  ).padStart(2, "0")}
                </span>
              </div>
              <div
                className="programme-visual"
                style={
                  { "--film-color": selected.color } as React.CSSProperties
                }
              >
                {selected.poster && (
                  <img
                    className="programme-backdrop"
                    src={selected.poster}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                <div className="programme-visual-shade" />
                <Poster
                  key={selected.id}
                  film={selected}
                  className="programme-poster"
                />
                <div className="visual-location">
                  <MapPin size={14} />
                  <span>
                    {place?.country ?? "COMING TO THE ATLAS"}
                    <strong>{place?.name ?? "다음 여정"}</strong>
                  </span>
                </div>
              </div>
              <div className="programme-title">
                <span className="film-category">{selected.category}</span>
                <h2>{selected.title}</h2>
                <p>
                  {selected.originalTitle}
                  <span>·</span>
                  {selected.release}
                </p>
              </div>
              <div
                className="programme-tabs"
                role="tablist"
                aria-label="영화 상세 정보"
              >
                <button
                  id="story-tab"
                  role="tab"
                  aria-selected={panelTab === "story"}
                  aria-controls="story-panel"
                  onClick={() => setPanelTab("story")}
                >
                  장소와 이야기
                </button>
                <button
                  id="community-tab"
                  role="tab"
                  aria-selected={panelTab === "community"}
                  aria-controls="community-panel"
                  onClick={() => setPanelTab("community")}
                >
                  <MessageCircle size={15} /> 함께 나누는 시선
                </button>
              </div>
              <div
                className="programme-body"
                key={selected.id + panelTab}
                id={panelTab === "story" ? "story-panel" : "community-panel"}
                role="tabpanel"
                aria-labelledby={
                  panelTab === "story" ? "story-tab" : "community-tab"
                }
              >
                {panelTab === "story" ? (
                  <>
                    <p className="film-intro">{selected.intro}</p>
                    <p className="film-experience">{selected.experience}</p>
                    <dl className="film-facts">
                      <div>
                        <dt>영화 속 시간</dt>
                        <dd>{selected.period}</dd>
                      </div>
                      <div>
                        <dt>감독</dt>
                        <dd>{selected.director}</dd>
                      </div>
                    </dl>
                    {!!selected.places.length && (
                      <div className="film-places">
                        <h3>이 영화의 장소</h3>
                        {selected.places.map((p) => (
                          <button
                            key={p.id}
                            className={place?.id === p.id ? "active" : ""}
                            onClick={() => selectFilm(selected, p)}
                          >
                            <MapPin size={15} />
                            <span>
                              {p.name}
                              <small>{p.note}</small>
                            </span>
                            {place?.id === p.id ? (
                              <Check size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {!selected.pending && (
                      <a
                        className="trailer-link"
                        href={
                          selected.trailer ??
                          `https://www.youtube.com/results?search_query=${encodeURIComponent(selected.originalTitle + " " + selected.release + " official trailer")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="play-small">▶</span>
                        <span>
                          {selected.trailer
                            ? "공식 예고편 보기"
                            : "YouTube에서 예고편 찾기"}
                          <small>영화 속 풍경을 만나보세요</small>
                        </span>
                        <ArrowUpRight size={17} />
                      </a>
                    )}
                    <details className="context-details">
                      <summary>
                        이야기와 실제 세계의 연결 <ChevronRight size={15} />
                      </summary>
                      <p>{selected.context}</p>
                      <div className="source-links">
                        {selected.sources.map((source) => (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={source.url}
                          >
                            {source.label}
                            <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                      <p className="source-note">
                        지도는 오늘날의 지리 위에 영화 속 장소를 연결합니다.
                      </p>
                    </details>
                  </>
                ) : (
                  <Community
                    key={selected.id}
                    film={selected}
                    session={session}
                    verification={verification}
                    onLogin={() => setAccountOpen(true)}
                  />
                )}
              </div>
              <div className="programme-footer">
                <span>HISTORY AT SITE</span>
                <span>
                  {place
                    ? `${Math.abs(place.lat).toFixed(2)}° ${place.lat >= 0 ? "N" : "S"} / ${Math.abs(place.lng).toFixed(2)}° ${place.lng >= 0 ? "E" : "W"}`
                    : "새로운 장소를 기다리며"}
                </span>
              </div>
            </>
          ) : (
            <div className="programme-empty">
              <Globe2 size={40} strokeWidth={1} />
              <h2>새로운 여정을 찾아보세요</h2>
              <p>
                검색어 또는 시대를 바꾸면
                <br />
                다른 영화들을 만날 수 있어요.
              </p>
              <button className="text-button" onClick={resetFilters}>
                모든 작품 보기
              </button>
            </div>
          )}
        </aside>
      </main>
      <footer className="site-footer">
        <span>
          HAS <span className="footer-dot">·</span> A PERSONAL JOURNEY THROUGH
          CINEMA
        </span>
        <span>우리가 살아보지 못한 시간, 가보지 못한 장소.</span>
      </footer>
      {accountOpen && (
        <AccountDialog
          session={session}
          verification={verification}
          recovery={recovery}
          authLoading={authLoading}
          onVerificationChanged={() =>
            setVerificationRevision((value) => value + 1)
          }
          onRecoveryDone={() => {
            setRecovery(false);
            clearAuthReturn();
          }}
          onClose={() => setAccountOpen(false)}
        />
      )}
    </div>
  );
}
