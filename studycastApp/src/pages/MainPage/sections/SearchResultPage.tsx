import { useEffect, useState } from "react";
import type { Room } from "@/types";
import { useT } from "@/theme";
import { useModal } from "@/contexts/ModalContext";
import { useSearch } from "@/contexts/SearchContext";
import { listRoomCards } from "@/services/roomService";
import { subscribeMainRoomUpdates } from "@/services/studyRoomService";
import { Icon } from "@/components/ui/Icon";

export function SearchResultPage() {
  const T = useT();
  const setModalRoom = useModal();
  const { query } = useSearch();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setRooms([]); return; }
    setLoading(true);
    setError(false);
    listRoomCards({ keyword: query.trim() })
      .then((res) => setRooms(res.rooms))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [query]);

  // 다른 사용자의 입장/퇴장으로 인한 인원수·LIVE 상태를 실시간 반영 (전체 재조회 없이 해당 방만 patch)
  useEffect(() => {
    return subscribeMainRoomUpdates(({ roomNo, currentUsers, live }) => {
      setRooms((prev) => prev.map((r) => (r.id === roomNo ? { ...r, members: currentUsers, live, overCapacity: currentUsers > r.max } : r)));
    });
  }, []);

  return (
    <section style={{ paddingBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
          "{query}" 검색 결과
        </h1>
        {!loading && rooms.length > 0 && (
          <span style={{ fontSize: 13, color: T.text3 }}>총 {rooms.length}개</span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: T.text3, padding: "60px 0" }}>검색 중...</div>
      ) : error ? (
        <div style={{ textAlign: "center", color: T.text3, padding: "60px 0" }}>검색 중 오류가 발생했습니다.</div>
      ) : rooms.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "calc(100vh - 360px)", padding: "40px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Icon name="search" size={44} color={T.text3} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            검색하신 조건과 일치하는 스터디 그룹이 없습니다.
          </div>
          <div style={{ fontSize: 13, color: T.text3 }}>
            다른 검색어나 카테고리로 다시 시도해보세요.
          </div>
        </div>
      ) : (
        <>
          <div className="live-grid">
            {rooms.map((r) => {
              const full = !r.overCapacity && r.members >= r.max;
              const isNew = r.createdDaysAgo != null && r.createdDaysAgo <= 10;
              const showLive = r.live && r.members >= 1;
              return (
                <div
                  key={r.id}
                  onClick={() => setModalRoom(r)}
                  style={{
                    borderRadius: 12, overflow: "hidden", cursor: "pointer",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.shadow,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = T.shadowHover;
                    e.currentTarget.style.borderColor = T.red;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = T.shadow;
                    e.currentTarget.style.borderColor = T.border;
                  }}
                >
                  <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: T.surface2 }}>
                    <img
                      src={r.img}
                      alt={r.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)" }} />
                    {showLive && (
                      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: T.red, color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />
                        LIVE
                      </div>
                    )}
                    {isNew && !showLive && (
                      <div style={{ position: "absolute", top: 10, left: 10, background: "#2e7d32", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 6 }}>NEW</div>
                    )}
                    {full && (
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <span style={{ background: "#424242", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 6 }}>마감</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 10px 8px", background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 60%)", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div style={{ color: "#fff", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="users" size={12} color="#fff" strokeWidth={1.8} />
                        {r.members}/{r.max}명
                        {r.type === "PREMIUM" && (
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="#FFD54F" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
                            <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px 14px", background: T.surface }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 12, color: T.text3 }}>
                      {r.cat} · 평균 {r.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

