import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/theme";
import { MY_ROOMS } from "@/data/rooms";
import { fmtTimer } from "@/utils/time";
import { Icon } from "@/components/ui/Icon";
import { openStudyRoom } from "@/utils/openStudyRoom";
import type { PlannerSchedule } from "@/data/planner";
import { SCHED_KEY } from "@/data/planner";
import { LearningPlannerModal } from "./planner/LearningPlannerModal";

export function MobileDashboard() {
  const T = useT();
  const navigate = useNavigate();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [editRes, setEditRes] = useState(false);
  const [res, setRes] = useState("오늘도 집중해서 목표 달성!");
  const [resDraft, setResDraft] = useState(res);
  const [myIdx, setMyIdx] = useState(0);

  const rooms = MY_ROOMS;
  const hasRooms = rooms.length > 0;
  const curRoom = hasRooms && myIdx < rooms.length ? rooms[myIdx] : null;

  const getInitialSchedules = (): PlannerSchedule[] => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(SCHED_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const add = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d;
    };
    const mk = (title: string, type: string, days: number): PlannerSchedule => {
      const d = add(days);
      return {
        title,
        type,
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        dday: Math.ceil((d.getTime() - today.getTime()) / 86400000),
        date: `${d.getMonth() + 1}월 ${d.getDate()}일`,
      };
    };
    return [
      mk("CS 파이널 시험", "시험", 0),
      mk("팀 프로젝트 발표", "과제", 5),
      mk("스터디 최종 발표", "모임", 12),
    ];
  };

  const [schedules, setSchedules] = useState<PlannerSchedule[]>(getInitialSchedules);

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!plannerOpen) {
      setSchedules(getInitialSchedules());
    }
  }, [plannerOpen]);

  const { h, m } = fmtTimer(elapsed);
  const pct = Math.min((elapsed / (8 * 3600)) * 100, 100);

  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const upcomingDday = [...schedules]
    .map((s) => ({
      ...s,
      dday: Math.ceil((new Date(s.year, s.month, s.day).getTime() - todayMid.getTime()) / 86400000),
    }))
    .filter((s) => s.dday >= 0)
    .sort((a, b) => a.dday - b.dday)[0] ?? null;

  return (
    <>
    <LearningPlannerModal open={plannerOpen} onClose={() => {
        setPlannerOpen(false);
        setSchedules(getInitialSchedules());
      }} />
    <section style={{ padding: "14px 16px 0" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text }}>내 스터디</h2>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setMyIdx((i) => Math.max(0, i - 1))}
              disabled={myIdx === 0}
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                border: `1px solid ${T.border}`,
                background: T.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: myIdx === 0 ? "not-allowed" : "pointer",
                opacity: myIdx === 0 ? 0.35 : 1,
              }}
            >
              <Icon name="chevLeft" size={13} color={T.text3} />
            </button>
            <button
              onClick={() => setMyIdx((i) => Math.min(rooms.length, i + 1))}
              disabled={myIdx === rooms.length}
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                border: `1px solid ${T.border}`,
                background: T.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: myIdx === rooms.length ? "not-allowed" : "pointer",
                opacity: myIdx === rooms.length ? 0.35 : 1,
              }}
            >
              <Icon name="chevRight" size={13} color={T.text3} />
            </button>
          </div>
        </div>
        <div style={{ position: "relative", borderRadius: T.radius, overflow: "hidden", height: 130, cursor: "pointer" }}>
          {!hasRooms ? (
            <div style={{ width: "100%", height: "100%", background: T.surface2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: `1.5px dashed ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.text3 }}>스터디방 참여하기</span>
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
                  onClick={() => openStudyRoom(curRoom.id)}
                  style={{ padding: "4px 12px", borderRadius: 5, border: "1.5px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  입장하기 →
                </button>
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
            lineHeight: 1, marginBottom: 8,
          }}>
            {h}<span style={{ fontSize: 12, color: T.text3, fontWeight: 400 }}>h</span>{" "}
            {m}<span style={{ fontSize: 12, color: T.text3, fontWeight: 400 }}>m</span>
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
            <span style={{ fontSize: 9, color: T.text3 }}>오늘 {h}h</span>
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
                border: `1.5px solid ${T.red}`,
                color: T.red,
                borderRadius: 5,
                padding: "3px 8px",
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
                background: "transparent",
              }}>
                {upcomingDday ? (upcomingDday.dday === 0 ? "D-day" : `D-${upcomingDday.dday}`) : "D-?"}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 500, color: T.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {upcomingDday ? upcomingDday.title : "등록된 D-day 일정이 없습니다."}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: T.border }} />
          <div>
            <div style={{ fontSize: 10, color: T.text3, marginBottom: 3 }}>내 각오</div>
            {editRes ? (
              <input
                value={resDraft}
                onChange={(e) => setResDraft(e.target.value)}
                onBlur={() => { setRes(resDraft); setEditRes(false); }}
                autoFocus
                style={{
                  width: "100%",
                  border: `1.5px solid ${T.red}`,
                  borderRadius: 4,
                  padding: "3px 6px",
                  fontSize: 11,
                  outline: "none",
                  background: T.surface,
                  color: T.text,
                }}
              />
            ) : (
              <div
                onClick={() => { setResDraft(res); setEditRes(true); }}
                style={{
                  fontSize: 11, color: T.text, fontWeight: 500,
                  lineHeight: 1.4, cursor: "pointer",
                }}
              >
                {res}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
