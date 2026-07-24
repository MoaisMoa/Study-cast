import { useEffect, useRef, useState } from "react";
import type { Room, RoomCategory } from "@/types";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { CATS_FILTER, TABS, VISIBILITY_OPTS } from "@/data/categories";
import type { VisibilityOpt } from "@/data/categories";
// 일반/프리미엄 필터 — UI에서 잠시 주석 처리됨, 추후 프리미엄 확장 시 재사용 예정. 삭제하지 말 것
// import { TYPE_OPTS } from "@/data/categories";
// import type { TypeOpt } from "@/data/categories";
import { Icon } from "@/components/ui/Icon";
import { DropdownModal, DropdownModalHeader } from "@/components/ui/Modal";
import { LiveStudyCard } from "@/components/study/LiveStudyCard";
import { useClickOutside } from "@/hooks/useClickOutside";
import { listRoomCards } from "@/services/roomService";
import { subscribeRoomJoined } from "@/utils/roomSession";
import { subscribeMainRoomUpdates } from "@/services/studyRoomService";

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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState(0);
  const [selCats, setSelCats] = useState<RoomCategory[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  // 일반/프리미엄 필터 — UI에서 잠시 주석 처리됨, 추후 프리미엄 확장 시 재사용 예정. 삭제하지 말 것
  // const [roomType, setRoomType] = useState<TypeOpt>("전체 스터디");
  // const [typeOpen, setTypeOpen] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityOpt>("전체 스터디");
  const [typeOpen, setTypeOpen] = useState(false);
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [cols, setCols] = useState<number>(getCol);
  const PAGE = cols * 4;

  // 필터값 변환 함수
  const toApiTab = () => (tab === 1 ? "NEW" : "ALL");

  // 일반/프리미엄 필터 — UI에서 잠시 주석 처리됨, 추후 프리미엄 확장 시 재사용 예정. 삭제하지 말 것
  // const toApiRoomType = () => {
  //   if (roomType === "일반") return "FREE";
  //   if (roomType === "프리미엄") return "PREMIUM";
  //   return "ALL";
  // };

  const toApiVisibility = () => {
    if (visibility === "공개") return "PUBLIC";
    if (visibility === "비공개") return "PRIVATE";
    return "ALL";
  };

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
  }


  // 서버 조회 함수
  const fetchRooms = async (nextPage: number, append: boolean) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await listRoomCards({
        tab: toApiTab(),
        categoryNos: toApiCategoryNos(),
        // roomType: toApiRoomType(), — 일반/프리미엄 필터 잠시 주석 처리됨, 추후 프리미엄 확장 시 재사용 예정
        visibility: toApiVisibility(),
        joinableOnly: onlyAvail,
        page: nextPage,
        size: PAGE,
      });

      setRooms((prev) => (append ? [...prev, ...response.rooms] : response.rooms));
      setPage(response.page);
      setLast(response.last);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
      // 로딩 중이라 무시됐던 새로고침 요청이 있으면 끝나는 즉시 재시도 (요청 누락 방지)
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        fetchRoomsRef.current(0, false);
      }
    }
  }

  // 필터 변경 시 첫 페이지 재조회 (로그인 상태가 바뀌어도 — joinable 등 결과가 달라질 수 있음)
  useEffect(() => {
    fetchRooms(0, false);
  }, [tab, selCats, visibility, onlyAvail, PAGE, isLoggedIn]);

  // 다른 탭에서 방 입장/퇴장이 완료되면(참여 인원 변경) 첫 페이지 재조회
  // — 마침 다른 fetch가 진행 중이면 요청이 그냥 버려지지 않도록 큐에 적어두고 끝나는 즉시 재시도
  const fetchRoomsRef = useRef(fetchRooms);
  useEffect(() => { fetchRoomsRef.current = fetchRooms; });
  const isLoadingRef = useRef(isLoading);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  const pendingRefreshRef = useRef(false);
  useEffect(() => {
    return subscribeRoomJoined(() => {
      if (isLoadingRef.current) pendingRefreshRef.current = true;
      else fetchRoomsRef.current(0, false);
    });
  }, []);

  // 다른 사용자의 입장/퇴장으로 인한 인원수·LIVE 상태를 실시간 반영 (전체 재조회 없이 해당 방만 patch)
  useEffect(() => {
    return subscribeMainRoomUpdates(({ roomNo, currentUsers, live }) => {
      setRooms((prev) => prev.map((r) => (r.id === roomNo ? { ...r, members: currentUsers, live, overCapacity: currentUsers > r.max } : r)));
    });
  }, []);

  // 더보기
  const loadMore = () => {
    if (last || isLoading) return;
    fetchRooms(page + 1, true);
  }

  const catRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  useClickOutside(catRef, () => setCatOpen(false), catOpen);
  useClickOutside(typeRef, () => setTypeOpen(false), typeOpen);

  useEffect(() => {
    const fn = () => setCols(getCol());
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  
  const visible = rooms;
  const hasMore = !last;

  const toggleCat = (c: RoomCategory) =>
    setSelCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

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
              관심 카테고리
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

          {/*
            일반/프리미엄 필터 — UI에서 잠시 주석 처리됨, 추후 프리미엄 확장 시 재사용 예정. 삭제하지 말 것
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
          */}

          {/* 공개/비공개 */}
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
                fontWeight: visibility !== "전체 스터디" ? 600 : 400,
                padding: "4px 2px",
              }}
            >
              {visibility}
              <Icon name="chevDown" size={14} color={T.text3} />
            </button>
            {typeOpen && (
              <DropdownModal style={{ width: 200 }}>
                <DropdownModalHeader title="공개 여부" />
                <div style={{
                  padding: "12px 14px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  {VISIBILITY_OPTS.map((opt) => {
                    const sel = visibility === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setVisibility(opt);
                          setTypeOpen(false);
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
        {visible.length === 0 && loadError && (
          <div style={{
            gridColumn: "1/-1",
            textAlign: "center",
            padding: "48px 0",
            color: T.red,
            fontSize: 14,
          }}>
            스터디 목록을 불러오지 못했습니다.
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => fetchRooms(0, false)}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${T.red}`,
                  background: "none", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
        {visible.length === 0 && !loadError && (
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
        {loadError && visible.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: T.red }}>목록을 불러오지 못했습니다. 다시 시도해주세요.</div>
        )}
        {!hasMore && (
          <div style={{ marginTop: 10, fontSize: 12, color: T.text3 }}>모든 항목을 불러왔습니다.</div>
        )}
      </div>
    </section>
  );
}
