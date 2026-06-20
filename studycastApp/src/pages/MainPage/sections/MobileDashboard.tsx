import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import type { MyRoom } from "@/types";
import { listMyRooms, getMainSummary } from "@/services/roomService";
import { fmtTimer } from "@/utils/time";
import { useModal } from "@/contexts/ModalContext";
import { Icon } from "@/components/ui/Icon";
import { LearningPlannerModal } from "./planner/LearningPlannerModal";

export function MobileDashboard() {
  const T = useT();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const setModalRoom = useModal();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [myIdx, setMyIdx] = useState(0);
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  // 로그인 사용자 개인 스터디 정보 영역
  const [todayStudySeconds, setTodayStudySeconds] = useState(0);
  const [ddayTitle, setDdayTitle] = useState<string | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [studyResolution, setStudyResolution] = useState<string | null>(null);

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

  const hasRooms = rooms.length > 0;
  const curRoom = hasRooms && myIdx < rooms.length ? rooms[myIdx] : null;

  const { h, m, s } = fmtTimer(todayStudySeconds);
  const pct = Math.min((todayStudySeconds / (8 * 3600)) * 100, 100);

  return (
    <>
    <LearningPlannerModal open={plannerOpen} onClose={() => setPlannerOpen(false)} />
    <section style={{ padding: "14px 16px 0" }}>
      {/* 내 스터디 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text }}>내 스터디</h2>
          {isLoggedIn && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setMyIdx((i) => Math.max(0, i - 1))} style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: myIdx === 0 ? 0.35 : 1 }}><Icon name="chevLeft" size={13} color={T.text3} /></button>
            <button onClick={() => setMyIdx((i) => Math.min(rooms.length, i + 1))} style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: myIdx === rooms.length ? 0.35 : 1 }}><Icon name="chevRight" size={13} color={T.text3} /></button>
          </div>
          )}
        </div>
        <div style={{ position: "relative", borderRadius: T.radius, overflow: "hidden", height: 130, cursor: "pointer" }}>
          {!isLoggedIn ? (
            <div style={{ width: "100%", height: "100%", background: T.surface2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: `1.5px dashed ${T.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="person" size={20} color={T.text3} />
              </div>
              <span style={{ fontSize: 13, color: T.text3, textAlign: "center", lineHeight: 1.6 }}>로그인 후 이용해주세요</span>
            </div>
          ) : !hasRooms ? (
            <div onClick={() => navigate("/rooms/new")} style={{ width: "100%", height: "100%", background: T.surface2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: `1.5px dashed ${T.border}`, cursor: "pointer" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="plus" size={18} color={T.text3} />
              </div>
              <span style={{ fontSize: 12, color: T.text3, textAlign: "center", lineHeight: 1.5 }}>스터디방<br />참여하기</span>
            </div>
          ) : myIdx === rooms.length ? (
            <div onClick={() => navigate("/rooms/new")} style={{ width: "100%", height: "100%", background: T.surface2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: `1.5px dashed ${T.border}`, borderRadius: T.radius }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.surface, border: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: T.text2 }}>＋</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text2 }}>스터디 만들기</div>
            </div>
          ) : curRoom ? (
            <>
              <img src={curRoom.img} alt={curRoom.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(0,0,0,.75) 0%,rgba(0,0,0,.15) 100%)" }} />
              {curRoom.live && (
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 3, background: T.red, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />
                  LIVE
                </div>
              )}
              <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.45)", borderRadius: 10, padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 600 }}>{myIdx + 1}/{rooms.length}</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", marginBottom: 3 }}>참여 중인 스터디</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{curRoom.title}</div>
                <button
                  onClick={() => {
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
                  style={{ padding: "4px 12px", borderRadius: 5, border: "1.5px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >입장하기 →</button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        <div style={{
          background: T.surface,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          padding: "12px 14px",
          boxShadow: T.shadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: T.text3 }}>오늘 공부한 시간</div>
            <button onClick={() => setPlannerOpen(true)} style={{ padding: "3px 8px", borderRadius: 5, border: `1.5px solid ${T.red}`, background: "none", color: T.red, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>플래너 보기</button>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 22, fontWeight: 700, color: T.red,
            lineHeight: 1, marginBottom: 8, letterSpacing: "0.04em",
          }}>
            {String(h).padStart(2, "0")}
            <span style={{ fontSize: 14, color: T.text3, fontWeight: 400, margin: "0 1px" }}>:</span>
            {String(m).padStart(2, "0")}
            <span style={{ fontSize: 14, color: T.text3, fontWeight: 400, margin: "0 1px" }}>:</span>
            {String(s).padStart(2, "0")}
          </div>
          <div style={{
            height: 5,
            background: T.bg,
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: `linear-gradient(90deg,${T.red},#FF7043)`,
              borderRadius: 3,
              transition: "width 0.8s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontSize: 9, color: T.text3 }}>오늘 {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
          </div>
        </div>

        <div style={{
          background: T.surface,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          padding: "12px 14px",
          boxShadow: T.shadow,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 10, color: T.text3, marginBottom: 4 }}>내 디데이</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                background: "none",
                color: T.red,
                border: `1.5px solid ${T.red}`,
                borderRadius: 5,
                padding: "3px 8px",
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}>
                {remainingDays === null
                  ? "D-day"
                  : remainingDays === 0
                    ? "D-day"
                    : `D-${remainingDays}`}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 500, color: T.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {ddayTitle ?? "등록된 일정이 없습니다."}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: T.border }} />
          <div>
            <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>내 각오</div>
            <div style={{ fontSize: 11, color: T.text, fontWeight: 500, lineHeight: 1.4 }}>
              {studyResolution || "자신만의 각오를 등록해보세요!"}
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
