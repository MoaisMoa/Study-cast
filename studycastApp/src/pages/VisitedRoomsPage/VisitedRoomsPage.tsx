import { useEffect, useMemo, useState } from "react";
import type {
  RoomCategory,
  VisitedRoom,
  VisitedStatusFilter,
  VisitedTab,
} from "@/types/visitedRoom";
import { useT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileTabBar } from "@/pages/MainPage/sections/MobileTabBar";
import {
  fetchRecentVisitedRooms,
  fetchFrequentVisitedRooms,
} from "@/services/visitedRoomService";
import { FilterRow } from "./sections/FilterRow";
import { VisitedRoomCard } from "./sections/VisitedRoomCard";
import { EntryModal } from "./sections/EntryModal";
import { EmptyState } from "./sections/EmptyState";
import { LoginRequiredState } from "@/components/ui/LoginRequiredState";

type LoadState = "loading" | "loaded" | "error";

const PAGE = 10;

/** 방문한 방 — 반응형 기준 MyStudyPage와 동일 (480 헤더 전환 + 그리드 600/768/1000/1100) */
export default function VisitedRoomsPage() {
  const T = useT();
  const isMobile = useIsMobile(768);
  const { isLoggedIn } = useAuth();

  const [tab, setTab] = useState<VisitedTab>("recent");
  const [catFilter, setCatFilter] = useState<RoomCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<VisitedStatusFilter>("전체");

  const [recentRooms, setRecentRooms] = useState<VisitedRoom[]>([]);
  const [recentPage, setRecentPage] = useState(0);
  const [recentLast, setRecentLast] = useState(false);

  const [frequentRooms, setFrequentRooms] = useState<VisitedRoom[]>([]);
  const [frequentPage, setFrequentPage] = useState(0);
  const [frequentLast, setFrequentLast] = useState(false);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [modalRoom, setModalRoom] = useState<VisitedRoom | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoadState("loading");
    Promise.all([
      fetchRecentVisitedRooms(0, PAGE),
      fetchFrequentVisitedRooms(0, PAGE),
    ])
      .then(([recent, frequent]) => {
        setRecentRooms(recent.rooms);
        setRecentPage(recent.page);
        setRecentLast(recent.last);
        setFrequentRooms(frequent.rooms);
        setFrequentPage(frequent.page);
        setFrequentLast(frequent.last);
        setLoadState("loaded");
      })
      .catch(() => setLoadState("error"));
  }, [isLoggedIn]);

  const hasAnyData = recentRooms.length > 0 || frequentRooms.length > 0;

  const applyFilters = (list: VisitedRoom[]): VisitedRoom[] => {
    let result = [...list];
    if (catFilter.length > 0)
      result = result.filter((r) => catFilter.includes(r.cat as RoomCategory));
    if (statusFilter !== "전체") {
      const map: Record<string, (r: VisitedRoom) => boolean> = {
        "입장 가능": (r) => r.status === "open",
        "정원 마감": (r) => r.status === "full",
        "운영 종료": (r) => r.status === "ended",
      };
      const fn = map[statusFilter];
      if (fn) result = result.filter(fn);
    }
    return result;
  };

  const displayRooms = useMemo(() => {
    const base = tab === "recent" ? recentRooms : frequentRooms;
    return applyFilters(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, recentRooms, frequentRooms, catFilter, statusFilter]);

  const hasMore = tab === "recent" ? !recentLast : !frequentLast;

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      if (tab === "recent") {
        const result = await fetchRecentVisitedRooms(recentPage + 1, PAGE);
        setRecentRooms((prev) => [...prev, ...result.rooms]);
        setRecentPage(result.page);
        setRecentLast(result.last);
      } else {
        const result = await fetchFrequentVisitedRooms(frequentPage + 1, PAGE);
        setFrequentRooms((prev) => [...prev, ...result.rooms]);
        setFrequentPage(result.page);
        setFrequentLast(result.last);
      }
    } catch {
      // 기존 데이터 유지
    } finally {
      setIsLoadingMore(false);
    }
  };

  const gridCss = `
    .visited-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:24px 16px;margin-bottom:28px;}
    @media(max-width:1100px){.visited-grid{grid-template-columns:repeat(4,1fr);}}
    @media(max-width:1000px){.visited-grid{grid-template-columns:repeat(3,1fr);}}
    @media(max-width:768px){.visited-grid{grid-template-columns:repeat(2,1fr);gap:16px 12px;}}
    @media(max-width:600px){.visited-grid{grid-template-columns:1fr;gap:16px;}}
    .visited-card{border-radius:10px;overflow:hidden;cursor:pointer;border:1px solid ${T.border};box-shadow:${T.shadow};transition:box-shadow 0.2s,transform 0.2s;}
    .visited-card:hover{box-shadow:${T.shadowHover};transform:translateY(-3px);}
    .visited-card-img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease;display:block;}
    .visited-card:hover .visited-card-img{transform:scale(1.04);}
    @media(max-width:479px){.visited-card-thumb{aspect-ratio:16/9;}}
  `;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: T.bg,
      color: T.text,
      transition: "background 0.25s, color 0.25s",
    }}>
      <style>{gridCss}</style>

      <EntryModal room={modalRoom} onClose={() => setModalRoom(null)} />

      {isMobile ? <MobileHeader /> : <Header />}

      <main style={{
        flex: 1,
        maxWidth: 1160,
        width: "100%",
        margin: "0 auto",
        padding: isMobile ? "20px 16px 76px" : "32px 28px 60px",
      }}>
        {!isLoggedIn ? (
          <LoginRequiredState message="방문한 스터디 그룹을 보려면 로그인이 필요해요." />
        ) : loadState === "loading" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 14, color: T.text3 }}>불러오는 중...</div>
          </div>
        ) : loadState === "error" ? (
          <EmptyState type="error" />
        ) : !hasAnyData ? (
          <EmptyState type="all" />
        ) : (
          <>
            <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: T.text, marginBottom: 6, lineHeight: 1.2 }}>
                  방문한 방
                </h1>
                <p style={{ fontSize: isMobile ? 13 : 14, color: T.text3, lineHeight: 1.6 }}>
                  최근 접속했거나 자주 방문한 스터디방을 다시 확인해보세요.
                </p>
              </div>
              {!isMobile && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.text3, whiteSpace: "nowrap", paddingBottom: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  재방문 없이 3개월 경과 시 자동 삭제됩니다
                </div>
              )}
            </div>

            <FilterRow
              tab={tab}
              onTabChange={(t) => { setTab(t); setCatFilter([]); setStatusFilter("전체"); }}
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            {displayRooms.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <>
                <div className="visited-grid">
                  {displayRooms.map((r) => (
                    <VisitedRoomCard key={r.id} room={r} tab={tab} onCardClick={setModalRoom} />
                  ))}
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={loadMore}
                    disabled={!hasMore || isLoadingMore}
                    style={{
                      padding: "10px 40px",
                      borderRadius: 6,
                      border: `1.5px solid ${hasMore && !isLoadingMore ? T.border : T.borderStrong}`,
                      background: T.surface,
                      fontSize: 13,
                      fontWeight: 500,
                      color: hasMore && !isLoadingMore ? T.text2 : T.text3,
                      transition: "all 0.15s",
                      cursor: hasMore && !isLoadingMore ? "pointer" : "not-allowed",
                      opacity: hasMore && !isLoadingMore ? 1 : 0.55,
                    }}
                    onMouseEnter={(e) => {
                      if (hasMore && !isLoadingMore) {
                        e.currentTarget.style.borderColor = T.red;
                        e.currentTarget.style.color = T.red;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasMore && !isLoadingMore) {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.color = T.text2;
                      }
                    }}
                  >
                    {isLoadingMore ? "불러오는 중..." : "더 많은 스터디 보기"}
                  </button>
                  {!hasMore && (
                    <div style={{ marginTop: 10, fontSize: 12, color: T.text3 }}>모든 항목을 불러왔습니다.</div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {isMobile && <MobileTabBar />}
    </div>
  );
}
