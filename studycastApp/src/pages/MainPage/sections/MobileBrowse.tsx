import { useEffect, useRef, useState } from "react";
import type { Room, RoomCategory } from "@/types";
import { useT } from "@/theme";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { CATS_FILTER, TYPE_OPTS } from "@/data/categories";
import type { TypeOpt } from "@/data/categories";
import { listRoomCards } from "@/services/roomService";
import { Icon } from "@/components/ui/Icon";

const TABS_M = ["전체", "신규"] as const;

export function MobileBrowse() {
  const T = useT();
  const ww = useWindowWidth();
  const is2col = ww >= 601 && ww <= 768;
  const { isLoggedIn } = useAuth();
  const setModalRoom = useModal();

  const [tab, setTab] = useState<number>(0);
  const [selCats, setSelCats] = useState<RoomCategory[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [roomType, setRoomType] = useState<TypeOpt>("전체 스터디");
  const [typeOpen, setTypeOpen] = useState(false);
  const [onlyAvail, setOnlyAvail] = useState(false);

  const PAGE = 6;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const visible = rooms;

  const catRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  useClickOutside(catRef, () => setCatOpen(false), catOpen);
  useClickOutside(typeRef, () => setTypeOpen(false), typeOpen);

  useEffect(() => {
    fetchRooms(0, false);
  }, [tab, selCats, roomType, onlyAvail]);

  const toApiCategoryNos = () => {
    const map: Record<RoomCategory, number> = {
      어학: 1,
      공무원: 2,
      "개발·IT": 3,
      자격증: 4,
      "취업·면접": 5,
      대학생: 6,
    };

    return selCats.map((cat) => map[cat]);
  };

  const fetchRooms = async (nextPage: number, append: boolean) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await listRoomCards({
        tab: tab === 1 ? "NEW" : "ALL",
        categoryNos: toApiCategoryNos(),
        roomType:
          roomType === "일반"
            ? "FREE"
            : roomType === "프리미엄"
            ? "PREMIUM"
            : "ALL",
        joinableOnly: onlyAvail,
        page: nextPage,
        size: PAGE,
      });

      setRooms((prev) => (append ? [...prev, ...response.rooms] : response.rooms));
      setPage(response.page);
      setLast(response.last);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCat = (c: RoomCategory) =>
    setSelCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  return (
    <section style={{ padding: "18px 16px 80px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 12 }}>
        라이브 스터디
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        {TABS_M.map((t, i) => (
          <button
            key={t}
            onClick={() => { setTab(i); }}
            style={{
              flexShrink: 0,
              padding: "5px 13px",
              borderRadius: 20,
              border: `1.5px solid ${tab === i ? T.text : T.border}`,
              background: tab === i ? T.text : "none",
              color: tab === i ? (T.dark ? "#1a1a1a" : "#fff") : T.text2,
              fontWeight: tab === i ? 600 : 400,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
        paddingBottom: 12,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div ref={catRef} style={{ position: "relative" }}>
          <button
            onClick={() => {
              if (!isLoggedIn) return;
              setCatOpen((v) => !v);
              setTypeOpen(false);
            }}
            title={!isLoggedIn ? "로그인 후 이용해주세요" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              fontSize: 13,
              color: isLoggedIn ? T.text2 : T.text3,
              cursor: isLoggedIn ? "pointer" : "not-allowed",
              fontWeight: selCats.length > 0 ? 600 : 400,
              padding: 0,
              opacity: isLoggedIn ? 1 : 0.5,
            }}
          >
            관심 카테고리
            {selCats.length > 0 && isLoggedIn && (
              <span style={{
                background: T.red, color: "#fff",
                borderRadius: "50%",
                width: 15, height: 15,
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selCats.length}
              </span>
            )}
            <Icon name="chevDown" size={13} color={T.text3} />
          </button>
          {catOpen && isLoggedIn && (
            <div style={{
              position: "absolute",
              left: 0, top: "calc(100% + 8px)",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              boxShadow: T.shadowModal,
              zIndex: 300,
              width: 160,
              overflow: "hidden",
            }}>
              <div style={{ padding: "10px 12px 12px" }}>
              {selCats.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <button
                    onClick={() => setSelCats([])}
                    style={{ fontSize: 11, color: T.text3, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, padding: 0 }}
                  >
                    <Icon name="x" size={10} color={T.text3} />전체 해제
                  </button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {CATS_FILTER.map((c) => {
                  const sel = selCats.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => { toggleCat(c); }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1.5px solid ${sel ? T.red : T.border}`,
                        background: sel ? T.redLight : T.bg,
                        color: sel ? T.red : T.text2,
                        fontWeight: sel ? 700 : 400,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {sel && <Icon name="check" size={11} color={T.red} strokeWidth={2.5} />}
                      {c}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 16, background: T.borderStrong, flexShrink: 0 }} />

        <div ref={typeRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setTypeOpen((v) => !v); setCatOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              background: "none", border: "none",
              fontSize: 13, color: T.text2, cursor: "pointer",
              fontWeight: roomType !== "전체 스터디" ? 600 : 400,
              padding: 0,
            }}
          >
            {roomType}
            <Icon name="chevDown" size={13} color={T.text3} />
          </button>
          {typeOpen && (
            <div style={{
              position: "absolute",
              left: 0, top: "calc(100% + 8px)",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              boxShadow: T.shadowModal,
              zIndex: 300,
              width: 170,
              overflow: "hidden",
            }}>
              <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {TYPE_OPTS.map((opt) => {
                  const sel = roomType === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        setRoomType(opt);
                        setTypeOpen(false);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1.5px solid ${sel ? T.red : T.border}`,
                        background: sel ? T.redLight : T.bg,
                        color: sel ? T.red : T.text2,
                        fontWeight: sel ? 700 : 400,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {sel && <Icon name="check" size={11} color={T.red} strokeWidth={2.5} />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 16, background: T.borderStrong, flexShrink: 0 }} />

        <label style={{
          display: "flex", alignItems: "center", gap: 5,
          cursor: "pointer",
          fontSize: 13, color: T.text2,
          userSelect: "none",
        }}>
          <div
            onClick={() => setOnlyAvail((v) => !v)}
            style={{
              width: 16, height: 16, borderRadius: 3, flexShrink: 0,
              border: `1.5px solid ${onlyAvail ? T.red : T.borderStrong}`,
              background: onlyAvail ? T.red : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              cursor: "pointer",
            }}
          >
            {onlyAvail && <Icon name="check" size={9} color="#fff" strokeWidth={2.5} />}
          </div>
          바로 참여 가능한 방
        </label>
      </div>

      <div style={is2col
        ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 12px", marginBottom: 16 }
        : { display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }
      }>
        {visible.map((r) => {
          const full = !r.overCapacity && r.members >= r.max;
          const showLive = r.live && r.members >= 1;
          const isNew = r.createdDaysAgo != null && r.createdDaysAgo <= 10;
          return (
            <div
              key={r.id}
              onClick={() => setModalRoom(r)}
              style={{
                borderRadius: 10, overflow: "hidden", cursor: "pointer",
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadow,
              }}
            >
              <div style={{ position: "relative", aspectRatio: is2col ? "4/3" : "16/9", overflow: "hidden" }}>
                <img
                  src={r.img}
                  alt={r.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)",
                }} />
                {showLive && (
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    display: "flex", alignItems: "center", gap: 4,
                    background: T.red, color: "#fff",
                    fontSize: 10, fontWeight: 800,
                    padding: "3px 8px", borderRadius: 5,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "#fff", display: "inline-block",
                      animation: "blink 1.2s ease-in-out infinite",
                    }} />
                    LIVE
                  </div>
                )}
                {isNew && !showLive && (
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    background: "#2e7d32", color: "#fff",
                    fontSize: 10, fontWeight: 800,
                    padding: "3px 8px", borderRadius: 5,
                  }}>
                    NEW
                  </div>
                )}
                {full && (
                  <div style={{ position: "absolute", top: 8, right: 8 }}>
                    <span style={{ background: "#424242", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>마감</span>
                  </div>
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "14px 8px 8px",
                  display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                }}>
                  <div style={{ color: "#fff", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="users" size={12} color="#fff" strokeWidth={1.8} />
                    {r.members}/{r.max}명
                    {r.type === "PREMIUM" && (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="#FFD54F" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
                        <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                      </svg>
                    )}
                  </div>
                  {r.isPrivate && (
                    <div style={{ color: "#fff", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
                      <Icon name="lock" size={11} color="#fff" strokeWidth={1.8} />비공개
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "11px 13px 13px", background: T.surface }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: T.text,
                  marginBottom: 3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {r.title.replace(/ \(비공개\)$/, "")}
                </div>
                <div style={{ fontSize: 12, color: T.text3 }}>
                  {r.cat} · 평균 {r.time}
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 0", color: T.text3, fontSize: 13 }}>
            해당 조건의 스터디가 없습니다.
          </div>
        )}
      </div>

      {!last && (
        <div style={{ textAlign: "center" }}>
          <button onClick={() => {
            if (isLoading) return;
            fetchRooms(page + 1, true);
          }}
          disabled={isLoading}
            style={{
              padding: "10px 32px",
              borderRadius: 6,
              border: `1.5px solid ${T.border}`,
              background: T.surface,
              fontSize: 13, fontWeight: 500,
              color: T.text2,
              cursor: "pointer",
            }}
          >
            {isLoading ? "불러오는 중..." : "더 보기"}
          </button>
        </div>
      )}
    </section>
  );
}
