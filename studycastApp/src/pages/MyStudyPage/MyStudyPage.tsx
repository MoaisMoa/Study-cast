import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ConfirmModalState,
  MyStudyRoom,
  SortValue,
  StatusFilter,
  VisibilityFilter,
} from "@/types/myStudy";
import { useT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/pages/MainPage/sections/MobileTabBar";
import { Icon } from "@/components/ui/Icon";
import { closeRooms, deleteRooms, listMyRooms } from "@/services/myStudyService";
import { calcRoomStatus, parseDate } from "@/utils/myStudyDate";
import { MyStudyToolbar } from "./sections/MyStudyToolbar";
import { MyStudyCard } from "./sections/MyStudyCard";
import { MyStudyCardMobile } from "./sections/MyStudyCardMobile";
import { MyStudyDetailModal } from "./sections/MyStudyDetailModal";
import { ConfirmActionModal } from "./sections/ConfirmActionModal";
import { EmptyState } from "./sections/EmptyState";

type LoadState = "loading" | "loaded" | "error";

/** 내 스터디 — 헤더 전환은 MainPage 기준(768px), 카드 컴포넌트 전환은 480px(목록형 카드 감성 유지) */
export default function MyStudyPage() {
  const T = useT();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);        // 헤더/탭바 전환 기준 (MainPage와 통일)
  const cardMobile = useWindowWidth() < 480; // 카드 컴포넌트(16:9) 전환 기준
  const { user, isLoading: authLoading } = useAuth();

  // 비로그인 접근 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const [rooms, setRooms] = useState<MyStudyRoom[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const [sortBy, setSortBy] = useState<SortValue>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("전체");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [detailRoom, setDetailRoom] = useState<MyStudyRoom | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModalState | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function load() {
    setLoadState("loading");
    listMyRooms()
      .then((data) => { setRooms(data); setLoadState("loaded"); })
      .catch(() => setLoadState("error"));
  }
  useEffect(() => {
    if (!authLoading && user) load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [authLoading, user]);

  // 정렬 + 필터
  const filtered = useMemo(() => {
    let list = [...rooms];
    if (statusFilter !== "전체") {
      list = list.filter((r) => calcRoomStatus(r) === statusFilter);
    }
    if (visibilityFilter !== "전체") {
      const v = visibilityFilter === "공개" ? "public" : "private";
      list = list.filter((r) => r.visibility === v);
    }
    list.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title, "ko");
      if (sortBy === "deadline") return parseDate(a.periodEnd).getTime() - parseDate(b.periodEnd).getTime();
      // recent: createdAt 내림차순
      return parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime();
    });
    return list;
  }, [rooms, statusFilter, visibilityFilter, sortBy]);

  const hasAnyRoom = rooms.length > 0;
  const isFilterActive = statusFilter !== "전체" || visibilityFilter !== "전체";

  /** 라이브 진행 중인 방 — 선택/삭제 불가 */
  const isRoomLive = (r: MyStudyRoom) =>
    calcRoomStatus(r) !== "종료" && r.isLive && r.members >= 1;

  const toggleSelect = (id: string) => {
    const room = rooms.find((r) => r.id === id);
    if (room && isRoomLive(room)) return; // 라이브 방은 선택 불가
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const selectedRooms = rooms.filter((r) => selectedIds.has(r.id));

  async function runConfirmedAction() {
    if (!confirm) return;
    setActionLoading(true);
    const ids = confirm.rooms.map((r) => r.id);
    try {
      if (confirm.type === "delete") {
        await deleteRooms(ids);
        setRooms((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      } else {
        await closeRooms(ids);
        // 종료 처리: periodEnd 를 과거로 만들어 상태를 "종료"로 — mock 반영
        setRooms((prev) =>
          prev.map((r) =>
            selectedIds.has(r.id) ? { ...r, periodEnd: "2000-01-01", isLive: false } : r
          )
        );
      }
    } finally {
      setActionLoading(false);
      setConfirm(null);
      exitSelectMode();
    }
  }

  const headerName = user?.name ?? "";

  // 인증 확인 전 렌더링 방지
  if (authLoading || !user) return null;

  // 그리드 CSS — 원본 반응형 기준 유지
  // >1100: 5열 / 1001~1100: 4열 / 769~1000: 3열 / 601~768: 2열 / ≤600: 1열
  const gridCss = `
    .mystudy-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:24px 16px;}
    @media(max-width:1100px){.mystudy-grid{grid-template-columns:repeat(4,1fr);}}
    @media(max-width:1000px){.mystudy-grid{grid-template-columns:repeat(3,1fr);}}
    @media(max-width:768px){.mystudy-grid{grid-template-columns:repeat(2,1fr);gap:16px 14px;}}
    @media(max-width:600px){.mystudy-grid{grid-template-columns:1fr;}}
  `;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: T.bg,
      color: T.text,
      transition: "background 0.25s",
    }}>
      <style>{gridCss}</style>
      {isMobile ? <MobileHeader /> : <Header />}

      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: 1160,
        margin: "0 auto",
        padding: isMobile ? "20px 16px 76px" : "32px 28px 60px",
      }}>
        {/* 페이지 헤더 */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: isMobile ? 18 : 24,
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", marginBottom: 4 }}>
              내 스터디
            </h1>
            <p style={{ fontSize: isMobile ? 12 : 13, color: T.text3 }}>
              내가 생성한 스터디 그룹을 관리하는 공간입니다.
            </p>
          </div>
          {!isMobile && (
            <button
              onClick={() => navigate("/rooms/new")}
              style={{
                flexShrink: 0, padding: "10px 18px", borderRadius: 8, border: "none",
                background: T.red, color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} />
              새 스터디 만들기
            </button>
          )}
        </div>

        {/* 툴바: 정렬 + 필터 + 선택모드 */}
        {loadState === "loaded" && hasAnyRoom && (
          <>
            <MyStudyToolbar
              isMobile={isMobile}
              sortBy={sortBy}
              onSortChange={setSortBy}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              visibilityFilter={visibilityFilter}
              onVisibilityChange={setVisibilityFilter}
            />

            {/* 결과 수 + 선택/취소 토글 (화면 설계 기준) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              minHeight: 32,
            }}>
              <span style={{ fontSize: 13, color: T.text3 }}>
                {isFilterActive ? "필터 결과 " : "전체 "}
                <strong style={{ color: T.text, fontWeight: 700 }}>{filtered.length}개</strong> 스터디
              </span>
              {!selectMode ? (
                <button
                  onClick={() => setSelectMode(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7,
                    border: `1.5px solid ${T.border}`, background: T.surface, color: T.text2,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}
                >
                  <Icon name="check" size={13} color="currentColor" strokeWidth={2.5} />선택
                </button>
              ) : (
                <button
                  onClick={exitSelectMode}
                  style={{
                    padding: "6px 12px", borderRadius: 7, border: `1.5px solid ${T.border}`,
                    background: T.surface, color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </>
        )}

        {/* 카드 그리드 / 상태 */}
        {loadState === "loading" ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: T.text3, fontSize: 14 }}>
            불러오는 중...
          </div>
        ) : loadState === "error" ? (
          <EmptyState type="error" onRetry={load} />
        ) : !hasAnyRoom ? (
          <EmptyState type="empty" onCreateClick={() => navigate("/rooms/new")} />
        ) : filtered.length === 0 ? (
          <EmptyState type="filtered" />
        ) : (
          <div className="mystudy-grid">
            {filtered.map((room) =>
              cardMobile ? (
                <MyStudyCardMobile
                  key={room.id}
                  room={room}
                  onCardClick={(r) => (selectMode ? toggleSelect(r.id) : setDetailRoom(r))}
                  selectMode={selectMode}
                  selected={selectedIds.has(room.id)}
                  onToggle={toggleSelect}
                  disabled={isRoomLive(room)}
                />
              ) : (
                <MyStudyCard
                  key={room.id}
                  room={room}
                  onCardClick={(r) => (selectMode ? toggleSelect(r.id) : setDetailRoom(r))}
                  selectMode={selectMode}
                  selected={selectedIds.has(room.id)}
                  onToggle={toggleSelect}
                  disabled={isRoomLive(room)}
                />
              )
            )}
          </div>
        )}

        {/* 모바일 새 스터디 만들기 버튼 (하단) — 선택 모드가 아닐 때만 */}
        {isMobile && !selectMode && loadState === "loaded" && hasAnyRoom && (
          <button
            onClick={() => navigate("/rooms/new")}
            style={{
              width: "100%", marginTop: 24, padding: "13px 0", borderRadius: 10, border: "none",
              background: T.red, color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Icon name="plus" size={16} color="#fff" strokeWidth={2.5} />
            새 스터디 만들기
          </button>
        )}
        {/* 선택 모드 하단 액션바 (sticky) — 화면 설계 기준 */}
        {selectMode && (
          <div style={{
            position: "sticky", bottom: isMobile ? 70 : 16, left: 0, right: 0, zIndex: 90,
            background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12,
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,.12)", marginTop: 16,
          }}>
            <span style={{ fontSize: 14, color: T.text2 }}>
              {selectedIds.size > 0 ? <strong style={{ color: T.red }}>{selectedIds.size}개</strong> : "0개"} 선택됨
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.text3, flex: 1 }}>
              <Icon name="alertCircle" size={14} color={T.text3} strokeWidth={1.8} />
              라이브 중인 스터디는 삭제할 수 없습니다.
            </span>
            <button
              onClick={() => setConfirm({ type: "delete", rooms: selectedRooms })}
              disabled={selectedIds.size === 0}
              style={{
                padding: "9px 20px", borderRadius: 8, border: "none",
                background: selectedIds.size === 0 ? T.surface2 : T.red,
                color: selectedIds.size === 0 ? T.text3 : "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
                transition: "all 0.15s", fontFamily: "'Noto Sans KR',sans-serif",
              }}
            >
              삭제
            </button>
          </div>
        )}
      </main>

      {!isMobile && <Footer />}
      {isMobile && <MobileTabBar />}

      <MyStudyDetailModal room={detailRoom} onClose={() => setDetailRoom(null)} />
      <ConfirmActionModal
        state={confirm}
        loading={actionLoading}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}
