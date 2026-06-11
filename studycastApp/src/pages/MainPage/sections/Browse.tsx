import { useEffect, useMemo, useRef, useState } from "react";
import type { Room, RoomCategory } from "@/types";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { CATS_FILTER, TABS, TYPE_OPTS } from "@/data/categories";
import type { TypeOpt } from "@/data/categories";
import { Icon } from "@/components/ui/Icon";
import { DropdownModal, DropdownModalHeader } from "@/components/ui/Modal";
import { LiveStudyCard } from "@/components/study/LiveStudyCard";
import { useClickOutside } from "@/hooks/useClickOutside";
import { listRooms } from "@/services/roomService";

function getCol(): number {
  if (typeof window === "undefined") return 5;
  const width = window.innerWidth;
  if (width >= 1101) return 5;
  if (width >= 1001) return 4;
  if (width >= 769) return 3;
  if (width >= 601) return 2;
  return 1;
}

export function Browse() {
  const T = useT();
  const { isLoggedIn } = useAuth();

  const [pool, setPool] = useState<Room[]>([]);
  useEffect(() => {
    listRooms().then(setPool);
  }, []);

  const [tab, setTab] = useState(0);
  const [selCats, setSelCats] = useState<RoomCategory[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [roomType, setRoomType] = useState<TypeOpt>("전체 스터디");
  const [typeOpen, setTypeOpen] = useState(false);
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  useClickOutside(catRef, () => setCatOpen(false), catOpen);
  useClickOutside(typeRef, () => setTypeOpen(false), typeOpen);

  const [cols, setCols] = useState<number>(getCol);
  useEffect(() => {
    const fn = () => setCols(getCol());
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const PAGE = cols * 4;
  const [visibleCount, setVisibleCount] = useState<number>(() => getCol() * 4);

  const filtered = useMemo<Room[]>(() => {
    const list = pool.filter((r) => {
      if (tab === 1 && (r.createdDaysAgo ?? 99) > 10) return false;
      if (selCats.length > 0 && !selCats.includes(r.cat)) return false;
      if (onlyAvail && r.members === r.max) return false;
      if (roomType === "일반" && r.type !== "FREE") return false;
      if (roomType === "프리미엄" && r.type !== "PREMIUM") return false;
      return true;
    });
    return list.sort((a, b) => {
      if (tab === 1) {
        const av = a.createdDaysAgo ?? 99;
        const bv = b.createdDaysAgo ?? 99;
        if (av !== bv) return av - bv;
        return a.title.localeCompare(b.title, "ko");
      }
      const aLive = a.live && a.members >= 1;
      const bLive = b.live && b.members >= 1;
      if (aLive !== bLive) return aLive ? -1 : 1;
      const av = a.createdDaysAgo ?? 99;
      const bv = b.createdDaysAgo ?? 99;
      if (av !== bv) return av - bv;
      return a.title.localeCompare(b.title, "ko");
    });
  }, [pool, tab, selCats, onlyAvail, roomType]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const toggleCat = (c: RoomCategory) =>
    setSelCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const loadMore = () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    window.setTimeout(() => {
      setVisibleCount((c) => c + PAGE);
      setIsLoading(false);
    }, 400);
  };

  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text }}>라이브 스터디</h2>
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          border: `1.5px solid ${T.text3}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: T.text3, fontWeight: 700, lineHeight: 1 }}>i</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => {
                setTab(i);
                setVisibleCount(PAGE);
              }}
              style={{
                padding: "7px 18px",
                borderRadius: 20,
                border: `1.5px solid ${tab === i ? T.text : T.borderStrong}`,
                background: tab === i ? T.text : "none",
                color: tab === i ? (T.dark ? "#0f1117" : "#fff") : T.text2,
                fontWeight: tab === i ? 700 : 400,
                fontSize: 14,
                transition: "all 0.15s",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* 관심 설정 */}
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
                gap: 4,
                background: "none",
                border: "none",
                fontSize: 14,
                color: isLoggedIn ? T.text2 : T.text3,
                cursor: isLoggedIn ? "pointer" : "not-allowed",
                fontWeight: selCats.length > 0 ? 600 : 400,
                padding: "4px 2px",
                opacity: isLoggedIn ? 1 : 0.5,
              }}
            >
              관심 설정
              {selCats.length > 0 && isLoggedIn && (
                <span style={{
                  background: T.red,
                  color: "#fff",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {selCats.length}
                </span>
              )}
              <Icon name="chevDown" size={14} color={T.text3} />
            </button>
            {catOpen && isLoggedIn && (
              <DropdownModal style={{ width: 280 }}>
                <DropdownModalHeader
                  title="카테고리"
                  onClear={selCats.length > 0 ? () => setSelCats([]) : null}
                />
                <div style={{
                  padding: "12px 14px 14px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}>
                  {CATS_FILTER.map((c) => {
                    const sel = selCats.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          toggleCat(c);
                          setVisibleCount(PAGE);
                        }}
                        style={{
                          padding: "9px 12px",
                          borderRadius: 9,
                          border: `1.5px solid ${sel ? T.red : T.border}`,
                          background: sel ? T.redLight : T.bg,
                          color: sel ? T.red : T.text2,
                          fontWeight: sel ? 700 : 400,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {sel && <Icon name="check" size={12} color={T.red} strokeWidth={2.5} />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </DropdownModal>
            )}
          </div>

          <div style={{ width: 1, height: 18, background: T.borderStrong }} />

          {/* 전체 스터디 */}
          <div ref={typeRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                setTypeOpen((v) => !v);
                setCatOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                fontSize: 14,
                color: T.text2,
                cursor: "pointer",
                fontWeight: roomType !== "전체 스터디" ? 600 : 400,
                padding: "4px 2px",
              }}
            >
              {roomType}
              <Icon name="chevDown" size={14} color={T.text3} />
            </button>
            {typeOpen && (
              <DropdownModal style={{ width: 200 }}>
                <DropdownModalHeader title="스터디 유형" />
                <div style={{
                  padding: "12px 14px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  {TYPE_OPTS.map((opt) => {
                    const sel = roomType === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setRoomType(opt);
                          setTypeOpen(false);
                          setVisibleCount(PAGE);
                        }}
                        style={{
                          padding: "9px 12px",
                          borderRadius: 9,
                          border: `1.5px solid ${sel ? T.red : T.border}`,
                          background: sel ? T.redLight : T.bg,
                          color: sel ? T.red : T.text2,
                          fontWeight: sel ? 700 : 400,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {sel && <Icon name="check" size={12} color={T.red} strokeWidth={2.5} />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </DropdownModal>
            )}
          </div>

          <div style={{ width: 1, height: 18, background: T.borderStrong }} />

          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontSize: 14,
            color: T.text2,
            userSelect: "none",
          }}>
            <div
              onClick={() => setOnlyAvail((v) => !v)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                flexShrink: 0,
                border: `1.5px solid ${onlyAvail ? T.red : T.borderStrong}`,
                background: onlyAvail ? T.red : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
            >
              {onlyAvail && <Icon name="check" size={11} color="#fff" strokeWidth={2.5} />}
            </div>
            바로 참여 가능한 방
          </label>
        </div>
      </div>

      <div className="live-grid">
        {visible.map((r) => (
          <LiveStudyCard key={r.id} room={r} />
        ))}
        {visible.length === 0 && (
          <div style={{
            gridColumn: "1/-1",
            textAlign: "center",
            padding: "48px 0",
            color: T.text3,
            fontSize: 14,
          }}>
            {tab === 1 ? "신규 스터디 그룹이 없습니다." : "해당 조건의 스터디가 없습니다."}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={loadMore}
          disabled={!hasMore || isLoading}
          style={{
            padding: "10px 40px",
            borderRadius: 6,
            border: `1.5px solid ${hasMore && !isLoading ? T.border : T.borderStrong}`,
            background: T.surface,
            fontSize: 13,
            fontWeight: 500,
            color: hasMore && !isLoading ? T.text2 : T.text3,
            transition: "all 0.15s",
            cursor: hasMore && !isLoading ? "pointer" : "not-allowed",
            opacity: hasMore && !isLoading ? 1 : 0.55,
          }}
          onMouseEnter={(e) => {
            if (hasMore && !isLoading) {
              e.currentTarget.style.borderColor = T.red;
              e.currentTarget.style.color = T.red;
            }
          }}
          onMouseLeave={(e) => {
            if (hasMore && !isLoading) {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.text2;
            }
          }}
        >
          {isLoading ? "불러오는 중..." : "더 많은 스터디 보기"}
        </button>
        {!hasMore && (
          <div style={{ marginTop: 10, fontSize: 12, color: T.text3 }}>모든 항목을 불러왔습니다.</div>
        )}
      </div>
    </section>
  );
}
