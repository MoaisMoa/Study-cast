import type { Room } from "@/types";
import { useT } from "@/theme";
import { useModal } from "@/contexts/ModalContext";
import { usePage } from "@/contexts/PageContext";
import { useSearch } from "@/contexts/SearchContext";
import { REC_ROOMS, ROOM_POOL } from "@/data/rooms";
import { Icon } from "@/components/ui/Icon";
import { PremiumCrown } from "@/components/ui/PremiumCrown";

export function SearchResultPage() {
  const T = useT();
  const setModalRoom = useModal();
  const { setPage } = usePage();
  const { query } = useSearch();

  const ALL_ROOMS: Room[] = [
    ...ROOM_POOL,
    ...REC_ROOMS.map((r) => ({ ...r, id: r.id + 50 })),
  ];
  const q = query.toLowerCase();
  const results = ALL_ROOMS.filter(
    (r, idx, self) =>
      self.findIndex((x) => x.id === r.id) === idx &&
      (r.title.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q))
  );

  // 최신순: live > recent > 나머지
  const sorted = [...results].sort((a, b) => {
    if (a.live && !b.live) return -1;
    if (!a.live && b.live) return 1;
    if (a.recent && !b.recent) return -1;
    if (!a.recent && b.recent) return 1;
    return 0;
  });

  return (
    <section style={{ paddingBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <button
          onClick={() => setPage("home")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none",
            cursor: "pointer", color: T.text3, fontSize: 13, padding: 0,
          }}
        >
          <Icon name="chevLeft" size={15} color={T.text3} />
          홈으로
        </button>
        <div style={{ height: 16, width: 1, background: T.border }} />
        <h1 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
          "{query}" 검색 결과
        </h1>
        {sorted.length > 0 && (
          <span style={{ fontSize: 13, color: T.text3 }}>총 {sorted.length}개</span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            검색하신 조건과 일치하는 스터디 그룹이 없습니다.
          </div>
          <div style={{ fontSize: 13, color: T.text3 }}>
            다른 검색어나 카테고리로 다시 시도해보세요.
          </div>
        </div>
      ) : (
        <>
          <style>{`.srch-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:24px 16px;}@media(max-width:1100px){.srch-grid{grid-template-columns:repeat(4,1fr);}}@media(max-width:1000px){.srch-grid{grid-template-columns:repeat(3,1fr);}}@media(max-width:768px){.srch-grid{grid-template-columns:repeat(2,1fr);gap:16px 14px;}}@media(max-width:600px){.srch-grid{grid-template-columns:1fr;gap:16px;}}`}</style>
          <div className="srch-grid">
            {sorted.map((r) => {
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
                  <div style={{
                    position: "relative",
                    aspectRatio: "4/3",
                    overflow: "hidden",
                    background: T.surface2,
                  }}>
                    <img
                      src={r.img}
                      alt={r.title}
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)",
                    }} />
                    {showLive && (
                      <div style={{
                        position: "absolute", top: 10, left: 10,
                        display: "flex", alignItems: "center", gap: 5,
                        background: T.red, color: "#fff",
                        fontSize: 12, fontWeight: 800,
                        padding: "4px 10px", borderRadius: 6,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#fff", display: "inline-block",
                          animation: "blink 1.2s ease-in-out infinite",
                        }} />
                        LIVE
                      </div>
                    )}
                    {isNew && !showLive && (
                      <div style={{
                        position: "absolute", top: 10, left: 10,
                        background: "#2e7d32", color: "#fff",
                        fontSize: 12, fontWeight: 800,
                        padding: "4px 10px", borderRadius: 6,
                      }}>
                        NEW
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      {full ? (
                        <span style={{
                          background: "#424242", color: "#fff",
                          fontSize: 11, fontWeight: 700,
                          padding: "4px 9px", borderRadius: 6,
                        }}>마감</span>
                      ) : null}
                    </div>
                    <div style={{
                      position: "absolute",
                      bottom: 0, left: 0, right: 0,
                      padding: "14px 10px 8px",
                      background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 60%)",
                    }}>
                      <div style={{
                        color: "#fff", fontSize: 12, fontWeight: 500,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <Icon name="users" size={12} color="#fff" strokeWidth={1.8} />
                        {r.members}/{r.max}명
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px 14px", background: T.surface }}>
                    <div style={{
                      fontSize: 15, fontWeight: 700,
                      color: T.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 4,
                    }}>
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
