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
import { fetchVisitedRooms } from "@/services/visitedRoomService";
import { FilterRow } from "./sections/FilterRow";
import { VisitedRoomCard } from "./sections/VisitedRoomCard";
import { EntryModal } from "./sections/EntryModal";
import { EmptyState } from "./sections/EmptyState";

type LoadState = "loading" | "loaded" | "error";

/** 방문한 방 — 반응형 기준 MyStudyPage와 동일 (480 헤더 전환 + 그리드 600/768/1000/1100) */
export default function VisitedRoomsPage() {
  const T = useT();
  const isMobile = useIsMobile(768);
  const { isLoggedIn } = useAuth();

  const [tab, setTab] = useState<VisitedTab>("recent");
  const [catFilter, setCatFilter] = useState<RoomCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<VisitedStatusFilter>("전체 상태");

  const [recentRooms, setRecentRooms] = useState<VisitedRoom[]>([]);
  const [frequentRooms, setFrequentRooms] = useState<VisitedRoom[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [modalRoom, setModalRoom] = useState<VisitedRoom | null>(null);

  useEffect(() => {
    setLoadState("loading");
    fetchVisitedRooms()
      .then(({ recentRooms, frequentRooms }) => {
        setRecentRooms(recentRooms);
        setFrequentRooms(frequentRooms);
        setLoadState("loaded");
      })
      .catch(() => setLoadState("error"));
  }, []);

  const hasAnyData = recentRooms.length > 0 || frequentRooms.length > 0;

  const applyFilters = (list: VisitedRoom[]): VisitedRoom[] => {
    let result = [...list];
    if (catFilter.length > 0) result = result.filter((r) => catFilter.includes(r.cat as RoomCategory));
    if (statusFilter !== "전체 상태") {
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
          <EmptyState type="all" />
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
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: T.text, marginBottom: 6, lineHeight: 1.2 }}>
                방문한 방
              </h1>
              <p style={{ fontSize: isMobile ? 13 : 14, color: T.text3, lineHeight: 1.6 }}>
                최근 접속했거나 자주 방문한 스터디방을 다시 확인해보세요.
              </p>
            </div>

            <FilterRow
              tab={tab}
              onTabChange={(t) => { setTab(t); setCatFilter([]); setStatusFilter("전체 상태"); }}
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            {displayRooms.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <div className="visited-grid">
                {displayRooms.map((r) => (
                  <VisitedRoomCard key={r.id} room={r} tab={tab} onCardClick={setModalRoom} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {isMobile && <MobileTabBar />}
    </div>
  );
}
