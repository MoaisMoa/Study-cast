import { useEffect, useState } from "react";import { useNavigate } from "react-router-dom";
import type { MyRoom } from "@/types";
import { useT } from "@/theme";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { Icon } from "@/components/ui/Icon";
import { fmtTimer } from "@/utils/time";
import { getMainSummary, listMyRooms } from "@/services/roomService";
import { LearningPlannerModal } from "./planner/LearningPlannerModal";

/** 내 스터디 + 스탯 (각오 / 디데이 / 타이머) */
export function Dashboard() {
  const T = useT();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const setModalRoom = useModal();
  const [plannerOpen, setPlannerOpen] = useState(false);

  const [rooms, setRooms] = useState<MyRoom[]>([]);

  const [myIdx, setMyIdx] = useState(0);

  const [todayStudySeconds, setTodayStudySeconds] = useState(0);
  const [ddayTitle, setDdayTitle] = useState<string | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [studyResolution, setStudyResolution] = useState<string | null>(null);

  // 로그인 시 summary 조회 추가
  useEffect(() => {
    if (!isLoggedIn) {
      setRooms([]);
      setTodayStudySeconds(0);
      setDdayTitle(null);
      setRemainingDays(null);
      setStudyResolution(null);
      return;
    }

    listMyRooms()
      .then(setRooms)
      .catch(() => setRooms([]));

    getMainSummary()
      .then((summary) => {
        setTodayStudySeconds(summary.todayStudySeconds ?? 0);
        setDdayTitle(summary.ddayTitle ?? null);
        setRemainingDays(summary.remainingDays ?? null);
        setStudyResolution(summary.studyResolution ?? null);
      })
      .catch(() => {
        setTodayStudySeconds(0);
        setDdayTitle(null);
        setRemainingDays(null);
        setStudyResolution(null);
      });
  }, [isLoggedIn]);

  const { h, m, s } = fmtTimer(todayStudySeconds);
  const pct = Math.min((todayStudySeconds / (8 * 3600)) * 100, 100);

  const hasRooms = rooms.length > 0;
  const curRoom = hasRooms ? rooms[Math.min(myIdx, rooms.length - 1)] : null;

  const ww = useWindowWidth();
  const stackDash = ww <= 768;

  const scrollToStudy = () =>
    document.getElementById("my-study-section")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
    <LearningPlannerModal open={plannerOpen} onClose={() => { setPlannerOpen(false); }} />
    <section
      id="my-study-section"
      style={stackDash ? {
        marginBottom: 32,
      } : {
        display: "grid",
        gridTemplateColumns: "1fr 1.7fr",
        gap: 20,
        marginBottom: 32,
      }}
    >
      {/* 왼쪽: 내 스터디 */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text }}>내 스터디</h2>
          {isLoggedIn && hasRooms && (
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setMyIdx((i) => Math.max(0, i - 1))}
                style={{
                  width: 26, height: 26, borderRadius: 4,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", opacity: myIdx === 0 ? 0.35 : 1,
                }}
              >
                <Icon name="chevLeft" size={14} color={T.text3} />
              </button>
              <button
                onClick={() => setMyIdx((i) => Math.min(rooms.length, i + 1))}
                style={{
                  width: 26, height: 26, borderRadius: 4,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", opacity: myIdx === rooms.length ? 0.35 : 1,
                }}
              >
                <Icon name="chevRight" size={14} color={T.text3} />
              </button>
            </div>
          )}
        </div>
        <div style={{
          aspectRatio: "4/3",
          borderRadius: T.radius,
          overflow: "hidden",
          position: "relative",
          cursor: isLoggedIn && hasRooms ? "pointer" : "default",
        }}>
          {!isLoggedIn ? (
            <div style={{
              width: "100%",
              height: "100%",
              background: T.surface2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: `1.5px dashed ${T.border}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: T.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="person" size={20} color={T.text3} />
              </div>
              <span style={{ fontSize: 13, color: T.text3, textAlign: "center", lineHeight: 1.6 }}>
                로그인 후<br />이용해주세요
              </span>
            </div>
          ) : !hasRooms ? (
            <div onClick={() => navigate("/rooms/new")} style={{
              width: "100%",
              height: "100%",
              background: T.surface2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: `1.5px dashed ${T.border}`,
              cursor: "pointer",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: T.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="plus" size={18} color={T.text3} />
              </div>
              <span style={{ fontSize: 12, color: T.text3, textAlign: "center", lineHeight: 1.5 }}>
                스터디방<br />참여하기
              </span>
            </div>
          ) : myIdx === rooms.length ? (
            <div
              onClick={() => navigate("/rooms/new")}
              style={{
                width: "100%",
                height: "100%",
                background: T.surface2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                border: `1.5px dashed ${T.border}`,
                cursor: "pointer",
                borderRadius: T.radius,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.red; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: T.surface2,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1.5px solid ${T.border}`,
              }}>
                <Icon name="plus" size={22} color={T.text3} strokeWidth={2} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text2, marginBottom: 2 }}>
                  스터디 만들기
                </div>
                <div style={{ fontSize: 11, color: T.text3 }}>
                  새 스터디방을 시작해보세요
                </div>
              </div>
            </div>
          ) : curRoom ? (
            <div
              onClick={() => setModalRoom({
                id: curRoom.id,
                title: curRoom.title,
                cat: curRoom.cat,
                time: curRoom.time,
                members: curRoom.members,
                max: curRoom.max,
                img: curRoom.img,
                live: curRoom.live,
                type: curRoom.type,
                isPrivate: curRoom.isPrivate,
                createdAt: curRoom.createdAt ? new Date(curRoom.createdAt).toISOString() : null,
                expiredAt: curRoom.expiredAt,
              })}
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              <img src={curRoom.img} alt={curRoom.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%)",
              }} />
              {curRoom.live && (
                <div style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: T.red,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 4,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: "50%", background: "#fff",
                    display: "inline-block",
                    animation: "blink 1.2s ease-in-out infinite",
                  }} />
                  LIVE
                </div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                  <Icon name="users" size={10} color="rgba(255,255,255,.8)" />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.8)" }}>
                    {curRoom.members}/{curRoom.max}명
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 7,
                }}>
                  {curRoom.title}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalRoom({
                      id: curRoom.id,
                      title: curRoom.title,
                      cat: curRoom.cat,
                      time: curRoom.time,
                      members: curRoom.members,
                      max: curRoom.max,
                      img: curRoom.img,
                      live: curRoom.live,
                      type: curRoom.type,
                      isPrivate: curRoom.isPrivate,
                      createdAt: curRoom.createdAt ? new Date(curRoom.createdAt).toISOString() : null,
                      expiredAt: curRoom.expiredAt,
                    });
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 5,
                    border: "1.5px solid rgba(255,255,255,.6)",
                    background: "rgba(255,255,255,.15)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    backdropFilter: "blur(4px)",
                    cursor: "pointer",
                  }}
                >
                  입장하기 →
                </button>
              </div>
              {rooms.length > 1 && (
                <div style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,.45)",
                  borderRadius: 10,
                  padding: "2px 7px",
                  fontSize: 10,
                  color: "#fff",
                  fontWeight: 600,
                }}>
                  {Math.min(myIdx, rooms.length - 1) + 1}/{rooms.length}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* 오른쪽: 스탯 */}
      <div style={stackDash ? { padding: "0 0 0 16px" } : {
        background: T.surface,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        padding: "12px 16px 12px",
        boxShadow: T.shadow,
        transition: "background 0.25s,border-color 0.25s",
      }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.text3 }}>오늘 공부한 시간</div>
            <button
              onClick={() => setPlannerOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, border: `1.5px solid ${T.red}`, background: "none", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.red; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.red; }}
            >
              플래너 보기
            </button>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 22,
            fontWeight: 600,
            color: T.red,
            letterSpacing: "0.04em",
            lineHeight: 1,
            marginBottom: 10,
          }}>
            {String(h).padStart(2, "0")}
            <span style={{ fontSize: 16, color: T.text3, fontWeight: 400, margin: "0 1px" }}>:</span>
            {String(m).padStart(2, "0")}
            <span style={{ fontSize: 16, color: T.text3, fontWeight: 400, margin: "0 1px" }}>:</span>
            {String(s).padStart(2, "0")}
          </div>
          <div style={{
            height: 8,
            background: T.bg,
            borderRadius: 4,
            overflow: "hidden",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: `linear-gradient(90deg,${T.red},#FF7043)`,
              borderRadius: 4,
              transition: "width 0.8s ease",
            }} />
          </div>
          <div style={{ marginTop: 5 }}>
            <span style={{ fontSize: 11, color: T.text2, fontWeight: 500 }}>오늘 {h}h</span>
          </div>
        </div>

        <div style={{ height: 1, background: T.border, marginBottom: 16 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* 내 각오 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>내 각오</span>
              <button
                onClick={() => navigate("/profile")}
                title="내 프로필에서 각오 수정"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  color: T.text3,
                  cursor: "pointer",
                }}
              >
                <Icon name="edit" size={11} color={T.text3} />
                설정
              </button>
            </div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 500, lineHeight: 1.5 }}>{studyResolution || "자신만의 각오를 등록해보세요!"}</div>
          </div>

          {/* 내 디데이 — 플래너의 가장 빠른 D-day와 연동 (설정은 플래너에서) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>내 디데이</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                background: "none",
                color: T.red,
                border: `1.5px solid ${T.red}`,
                borderRadius: 6,
                padding: "4px 11px",
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 700,
                fontSize: 17,
                flexShrink: 0,
                lineHeight: 1.2,
              }}>
                {remainingDays === null
                  ? "D-day"
                  : remainingDays === 0
                    ? "D-day"
                    : `D-${remainingDays}`}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.text, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ddayTitle ?? "등록된 일정이 없습니다."}</div>
            </div>
            <div
              onClick={() => setPlannerOpen(true)}
              style={{ fontSize: 13, color: T.text3, lineHeight: 1.4, cursor: "pointer" }}
            >
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
