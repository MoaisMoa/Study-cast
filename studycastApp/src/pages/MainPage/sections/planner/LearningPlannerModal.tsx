import { useCallback, useEffect, useState } from "react";
import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import type { WeekPlan } from "@/data/planner";
import {
  PLANNER_CAT_COLOR, plannerIc, plannerIcText,
  plannerLv, toMin, toMinExt,
} from "@/data/planner";
import {
  fetchDdays, createDday, deleteDday,
  fetchMonthlyStudyStats,
  fetchWeekPlans, createWeekPlan, updateWeekPlan, deleteWeekPlan,
} from "@/services/plannerService";
import type { DdayResponse, MonthlyStudyStats } from "@/services/plannerService";
import { PlanEditModal } from "./PlanEditModal";
import { PlannerAddModal } from "./PlannerAddModal";
import type { PlanPayload, SchedulePayload } from "./PlannerAddModal";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export interface LearningPlannerModalProps {
  open: boolean;
  onClose: () => void;
  /** 일정이 추가/삭제된 후 호출 — Dashboard D-Day 재조회용 */
  onScheduleChanged?: () => void;
}

/** 학습 플래너 모달 — 캘린더(월별 출석/D-DAY) + 플래너(주간 수강표) */
export function LearningPlannerModal({ open, onClose, onScheduleChanged }: LearningPlannerModalProps) {
  const T = useT();
  const IC = plannerIc(T.dark);
  const IC_TEXT = plannerIcText(T.dark);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [mainTab, setMainTab] = useState<"calendar" | "planner">("calendar");
  const [calTab, setCalTab] = useState<"calendar" | "dday" | "schedules">("calendar");
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  const [showAdd, setShowAdd] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStudyStats | null>(null);

  useEffect(() => {
    const fn = () => setIsNarrow(window.innerWidth <= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // 월이 바뀔 때마다 월별 공부 통계 조회
  useEffect(() => {
    if (!open) return;
    setMonthlyStats(null);
    fetchMonthlyStudyStats(viewYear, viewMonth + 1)
      .then(setMonthlyStats)
      .catch(() => setMonthlyStats(null));
  }, [open, viewYear, viewMonth]);

  const prevMonth = () => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: Array<number | null> = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const todayDate = now.getDate();

  // 실제 일별 공부 시간 → 캘린더 색상용 문자열 변환
  const studyData: Record<number, string> = (() => {
    if (!monthlyStats) return {};
    const result: Record<number, string> = {};
    for (const [dayStr, secs] of Object.entries(monthlyStats.dailySeconds)) {
      const day = Number(dayStr);
      const h = secs / 3600;
      if (h >= 10) {
        result[day] = `${Math.floor(h)}h`;
      } else if (h >= 1) {
        const m = Math.floor((secs % 3600) / 60);
        result[day] = m > 0 ? `${Math.floor(h)}h${m}m` : `${Math.floor(h)}h`;
      } else {
        const m = Math.floor(secs / 60);
        result[day] = `${m}m`;
      }
    }
    return result;
  })();

  const ddayLabel = (d: number) => (d > 0 ? `D-${d}` : d === 0 ? "D-day" : `D+${Math.abs(d)}`);

  // ── 일정 (서버 API) ──
  const [schedules, setSchedules] = useState<DdayResponse[]>([]);

  const loadSchedules = useCallback(async () => {
    try {
      const data = await fetchDdays();
      setSchedules(data);
    } catch {
      setSchedules([]);
    }
  }, []);

  useEffect(() => {
    if (open) loadSchedules();
  }, [open, loadSchedules]);

  const addSchedule = async (s: SchedulePayload) => {
    try {
      await createDday({ title: s.title, targetDate: s.dateRaw });
      await loadSchedules();
      onScheduleChanged?.();
    } catch {
      alert("일정 등록에 실패했습니다. 서버 연결을 확인해주세요.");
    }
  };

  const deleteSchedule = async (ddayNo: number) => {
    try {
      await deleteDday(ddayNo);
      setSchedules((prev) => prev.filter((s) => s.ddayNo !== ddayNo));
      onScheduleChanged?.();
    } catch {
      alert("일정 삭제에 실패했습니다. 서버 연결을 확인해주세요.");
    }
  };

  const fmtDate = (targetDate: string) => {
    const d = new Date(targetDate + "T00:00:00");
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  // ── 주간 계획 (API) ──
  const [weekPlan, setWeekPlan] = useState<WeekPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<WeekPlan | null>(null);
  const [planOverlapMsg, setPlanOverlapMsg] = useState("");

  const loadWeekPlans = useCallback(async () => {
    try {
      const data = await fetchWeekPlans();
      setWeekPlan(data.map((r) => ({
        id: r.planNo,
        day: r.dayOfWeek,
        title: r.title,
        cat: "",
        color: r.color,
        start: r.startTime,
        end: r.endTime,
      })));
    } catch {
      setWeekPlan([]);
    }
  }, []);

  useEffect(() => {
    if (open) loadWeekPlans();
  }, [open, loadWeekPlans]);

  const addPlan = (s: PlanPayload): boolean => {
    const ns = toMinExt(s.start), ne = toMinExt(s.end);
    if (ns >= ne) { setPlanOverlapMsg("종료 시간은 시작 시간보다 늦어야 합니다."); setTimeout(() => setPlanOverlapMsg(""), 2500); return false; }
    const overlap = weekPlan.some((p) => p.day === s.day && toMinExt(p.start) < ne && toMinExt(p.end) > ns);
    if (overlap) { setPlanOverlapMsg("해당 시간대에 이미 계획이 있습니다."); setTimeout(() => setPlanOverlapMsg(""), 2500); return false; }
    setPlanOverlapMsg("");
    createWeekPlan({ dayOfWeek: s.day, title: s.title, color: s.color || "#E57373", startTime: s.start, endTime: s.end })
      .then(loadWeekPlans)
      .catch(() => alert("계획 저장에 실패했습니다."));
    return true;
  };
  const handleAdd = (s: SchedulePayload | PlanPayload): boolean => {
    if (mainTab === "planner") return addPlan(s as PlanPayload);
    addSchedule(s as SchedulePayload);
    return true;
  };
  const savePlan = (s: WeekPlan): boolean => {
    const ns = toMinExt(s.start), ne = toMinExt(s.end);
    if (ns >= ne) return false;
    const overlap = weekPlan.some((p) => p.id !== s.id && p.day === s.day && toMinExt(p.start) < ne && toMinExt(p.end) > ns);
    if (overlap) return false;
    updateWeekPlan(s.id, { dayOfWeek: s.day, title: s.title, color: s.color || "#E57373", startTime: s.start, endTime: s.end })
      .then(loadWeekPlans)
      .catch(() => alert("계획 수정에 실패했습니다."));
    return true;
  };
  const deletePlan = (id: number) => {
    deleteWeekPlan(id)
      .then(loadWeekPlans)
      .catch(() => alert("계획 삭제에 실패했습니다."));
  };

  // 일자별 일정 개수 — 한 칸에 점은 최대 3개까지만 표시
  const scheduleCountByDay = new Map<number, number>();
  schedules
    .filter((s) => {
      const d = new Date(s.targetDate + "T00:00:00");
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    })
    .forEach((s) => {
      const day = new Date(s.targetDate + "T00:00:00").getDate();
      scheduleCountByDay.set(day, (scheduleCountByDay.get(day) ?? 0) + 1);
    });
  const upcomingDdays = [...schedules]
    .filter((s) => s.remainingDays >= 0)
    .sort((a, b) => a.remainingDays - b.remainingDays)
    .slice(0, 3);
  const attendDays = monthlyStats?.attendDays ?? 0;
  const totalStudyH = (() => {
    const secs = monthlyStats?.totalSeconds ?? 0;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h === 0 && m === 0) return "0분";
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}분`;
  })();
  const avgStudyMin = (() => {
    if (!monthlyStats || attendDays === 0) return "0분";
    const avgSecs = Math.round(monthlyStats.totalSeconds / attendDays);
    const h = Math.floor(avgSecs / 3600);
    const m = Math.floor((avgSecs % 3600) / 60);
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}분`;
  })();

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {/* 탭 (캘린더 / 플래너) */}
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "flex-end", flexShrink: 0, width: "min(840px,98vw)", maxWidth: "98vw" }}>
        {([["calendar", "캘린더"], ["planner", "플래너"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMainTab(key)}
            style={{ padding: "8px 22px 10px", fontSize: 14, fontWeight: mainTab === key ? 700 : 500, color: mainTab === key ? T.red : T.text, background: T.surface, border: "none", borderBottom: mainTab === key ? `2px solid ${T.red}` : "none", borderRadius: "10px 10px 0 0", cursor: "pointer", marginRight: 2, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {key === "calendar"
                ? <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>
                : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
            </svg>
            {label}
          </button>
        ))}
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: "0 10px 20px 20px", width: "min(840px,98vw)", maxWidth: "98vw", height: "min(580px,92dvh)", maxHeight: "92dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.3)", position: "relative" }}>
        {/* 헤더 행 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {mainTab === "calendar" && <>
              <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 8px", fontSize: 18, color: T.text2, borderRadius: 4, lineHeight: 1 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{viewYear}년 {String(viewMonth + 1).padStart(2, "0")}월</span>
              <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 8px", fontSize: 18, color: T.text2, borderRadius: 4, lineHeight: 1 }}>›</button>
            </>}
            {mainTab === "planner" && (
              <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{String(now.getMonth() + 1).padStart(2, "0")}월 {String(now.getDate()).padStart(2, "0")}일</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${T.red}`, background: "none", color: T.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Icon name="plus" size={12} color={T.red} /> {mainTab === "calendar" ? "일정 등록" : "계획 추가"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
              <Icon name="x" size={18} color={T.text3} />
            </button>
          </div>
        </div>

        {/* 모바일 탭 */}
        {isNarrow && mainTab === "calendar" && (
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {([["calendar", "달력"], ["dday", "D-DAY"], ["schedules", "일정 목록"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setCalTab(key)}
                style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: calTab === key ? 700 : 400, color: calTab === key ? T.red : T.text3, background: "none", border: "none", borderBottom: `2px solid ${calTab === key ? T.red : "transparent"}`, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* 범례 */}
        {mainTab === "calendar" && (!isNarrow || calTab === "calendar") && (
          <div style={{ display: "flex", gap: 10, padding: "5px 16px", flexShrink: 0, flexWrap: "wrap", borderBottom: `1px solid ${T.border}` }}>
            {[["미출석", IC[0]], ["2시간+", IC[1]], ["6시간+", IC[2]], ["10시간+", IC[3]]].map(([l, bg]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: bg, border: "1px solid rgba(0,0,0,.1)" }} />
                <span style={{ fontSize: 10, color: T.text2 }}>{l}</span>
              </div>
            ))}
          </div>
        )}

        {/* 본문 */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* 달력 */}
          {mainTab === "calendar" && (!isNarrow || calTab === "calendar") && (
            <div style={{ flex: 1, padding: "8px 16px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 3, flexShrink: 0 }}>
                {DAYS.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.text2, padding: "2px 0" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridAutoRows: "1fr", gap: 3, flex: 1 }}>
                {cells.map((d, i) => {
                  if (!d) return <div key={"e" + i} />;
                  const data = studyData[d], lvv = plannerLv(data), isT = isCurrentMonth && d === todayDate;
                  const bg = IC[Math.max(0, lvv < 0 ? 0 : lvv)];
                  const tc = IC_TEXT[Math.max(0, lvv < 0 ? 0 : lvv)];
                  const dotCount = Math.min(3, scheduleCountByDay.get(d) ?? 0);
                  return (
                    <div key={d} style={{ background: bg, border: isT ? `2px solid ${T.red}` : `1px solid ${T.dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)"}`, borderRadius: 6, padding: "3px 5px 2px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: isT ? 700 : 400, color: lvv >= 1 ? tc : T.text }}>{d}</span>
                      {lvv >= 1 && data && <span style={{ fontSize: 9, fontFamily: "monospace", color: tc, fontWeight: 700 }}>{data}</span>}
                      {dotCount > 0 && (
                        <span style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: dotCount }).map((_, dotIdx) => (
                            <span key={dotIdx} style={{ width: 4, height: 4, background: lvv >= 2 ? "#fff" : T.red, borderRadius: "50%", display: "block", flexShrink: 0 }} />
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* D-DAY 패널 */}
          {mainTab === "calendar" && (!isNarrow || calTab === "dday") && (
            <div style={{ width: isNarrow ? "100%" : "clamp(140px,22%,176px)", borderLeft: isNarrow ? "none" : `1px solid ${T.border}`, padding: isNarrow ? 20 : 14, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
              <div>
                <div style={{ fontSize: isNarrow ? 13 : 10, fontWeight: 700, color: T.text3, letterSpacing: ".08em", marginBottom: isNarrow ? 14 : 8 }}>D-DAY</div>
                {upcomingDdays.length === 0
                  ? <div style={{ fontSize: isNarrow ? 15 : 12, color: T.text3, textAlign: "center", padding: "20px 0", background: T.surface2, borderRadius: 10 }}>등록된 일정이 없습니다.</div>
                  : <>
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: isNarrow ? 18 : 10, textAlign: "center", marginBottom: isNarrow ? 14 : 8 }}>
                      <div style={{ fontSize: isNarrow ? 16 : 12, fontWeight: 600, color: T.text2, marginBottom: isNarrow ? 8 : 4 }}>{upcomingDdays[0].title}</div>
                      <div style={{ fontWeight: 700, fontSize: isNarrow ? 38 : 22, color: T.red, lineHeight: 1 }}>{ddayLabel(upcomingDdays[0].remainingDays)}</div>
                      <div style={{ fontSize: isNarrow ? 13 : 10, color: T.text2, marginTop: isNarrow ? 8 : 3 }}>{fmtDate(upcomingDdays[0].targetDate)}</div>
                    </div>
                    {upcomingDdays.slice(1).map((s, i, arr) => (
                      <div key={s.ddayNo} style={{ padding: isNarrow ? "12px 0" : "6px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ fontSize: isNarrow ? 15 : 12, fontWeight: 500, color: T.text, marginBottom: isNarrow ? 4 : 2 }}>{s.title}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: isNarrow ? 13 : 10, color: T.text3 }}>{fmtDate(s.targetDate)}</span>
                          <span style={{ fontSize: isNarrow ? 13 : 10, color: T.red, fontWeight: 600 }}>{ddayLabel(s.remainingDays)}</span>
                        </div>
                      </div>
                    ))}
                  </>}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ paddingTop: isNarrow ? 16 : 10, borderTop: `1px solid ${T.border}`, marginTop: isNarrow ? 16 : 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: isNarrow ? 10 : 6 }}>
                  <div style={{ fontSize: isNarrow ? 13 : 10, fontWeight: 700, color: T.text3, letterSpacing: ".06em" }}>이달 출석</div>
                  <div style={{ fontSize: isNarrow ? 10 : 8, color: T.text3, fontWeight: 400 }}>2시간 이상 공부 시 인정</div>
                </div>
                {[["출석일", `${attendDays}일`], ["총 공부", totalStudyH], ["일평균", avgStudyMin]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: isNarrow ? 8 : 4 }}>
                    <span style={{ fontSize: isNarrow ? 14 : 11, color: T.text2 }}>{l}</span>
                    <span style={{ fontSize: isNarrow ? 14 : 11, fontWeight: 600, color: l === "총 공부" ? T.red : T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 일정 목록 — 모바일 */}
          {mainTab === "calendar" && isNarrow && calTab === "schedules" && (
            <div style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 8 }}>등록된 일정 ({schedules.length})</div>
              {schedules.length === 0
                ? <div style={{ fontSize: 12, color: T.text3 }}>등록된 일정이 없습니다.</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {schedules.map((s) => (
                    <div key={s.ddayNo} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface2, borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.red, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{s.title}</div>
                          <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{fmtDate(s.targetDate)} · <span style={{ color: T.red, fontWeight: 600 }}>{ddayLabel(s.remainingDays)}</span></div>
                        </div>
                      </div>
                      <button onClick={() => deleteSchedule(s.ddayNo)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexShrink: 0 }}><Icon name="x" size={14} color={T.text3} /></button>
                    </div>
                  ))}
                </div>}
            </div>
          )}

          {/* 플래너 탭 — 주간 수강표 */}
          {mainTab === "planner" && (() => {
            const W_DAYS = ["월", "화", "수", "목", "금", "토", "일"];
            const W_SLOT = 52;
            const W_HOURS = Array.from({ length: 19 }, (_, i) => i + 6);
            const nowDay = (now.getDay() + 6) % 7;
            const nowH = now.getHours(), nowMin = now.getMinutes();
            return (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ flexShrink: 0, display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                  <div style={{ width: 40, flexShrink: 0, borderRight: `1px solid ${T.border}` }} />
                  {W_DAYS.map((d, i) => (
                    <div key={d} style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: i === nowDay ? 700 : 500, color: i === nowDay ? T.red : T.text2, padding: "6px 0", borderRight: `1px solid ${T.border}`, background: i === nowDay ? T.redLight : "none" }}>{d}</div>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <div style={{ display: "flex", minHeight: W_HOURS.length * W_SLOT }}>
                    <div style={{ width: 40, flexShrink: 0, borderRight: `1px solid ${T.border}` }}>
                      {W_HOURS.map((h) => (
                        <div key={h} style={{ height: W_SLOT, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 6, paddingTop: 2 }}>
                          <span style={{ fontSize: 9, color: T.text3, fontWeight: 500 }}>{String(h).padStart(2, "0")}</span>
                        </div>
                      ))}
                    </div>
                    {W_DAYS.map((d, dayIdx) => (
                      <div key={d} style={{ flex: 1, position: "relative", borderRight: `1px solid ${T.border}` }}>
                        {W_HOURS.map((h, hi) => (
                          <div key={h} style={{ height: W_SLOT, borderBottom: `1px solid ${T.border}`, background: hi % 2 === 0 ? T.surface : T.bg }} />
                        ))}
                        {dayIdx === nowDay && (
                          <div style={{ position: "absolute", left: 0, right: 0, top: (((nowH < 6 ? nowH + 24 : nowH) * 60 + nowMin - 6 * 60) / 60) * W_SLOT, zIndex: 3, display: "flex", alignItems: "center" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, flexShrink: 0, marginLeft: -3 }} />
                            <div style={{ flex: 1, height: 1.5, background: T.red }} />
                          </div>
                        )}
                        {weekPlan.filter((p) => p.day === dayIdx).map((plan) => {
                          const rawS = toMin(plan.start); const sM = rawS < 6 * 60 ? rawS + 24 * 60 : rawS;
                          const rawE = toMin(plan.end); const eM = rawE < 6 * 60 ? rawE + 24 * 60 : rawE;
                          const top = ((sM - 6 * 60) / 60) * W_SLOT;
                          const height = Math.max((eM - sM) / 60 * W_SLOT, 18);
                          const col = plan.color || (PLANNER_CAT_COLOR[plan.cat] || T.red);
                          return (
                            <div key={plan.id} onClick={() => setEditingPlan(plan)} style={{ position: "absolute", left: 1, right: 1, top, height, borderRadius: 5, background: col, padding: "3px 5px", overflow: "hidden", cursor: "pointer" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plan.title}</div>
                              {height > 30 && <div style={{ fontSize: 9, color: "rgba(255,255,255,.8)", marginTop: 1 }}>{plan.start.slice(0, 5)}</div>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 일정 목록 하단 — 캘린더 탭, 데스크탑 */}
        {mainTab === "calendar" && !isNarrow && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "7px 16px 9px", flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 5 }}>등록된 일정 ({schedules.length})</div>
            {schedules.length === 0
              ? <div style={{ fontSize: 12, color: T.text3, padding: "6px 0" }}>등록된 일정이 없습니다.</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: schedules.length > 3 ? "108px" : "auto", overflowY: schedules.length > 3 ? "auto" : "visible" }}>
                {schedules.map((s) => (
                  <div key={s.ddayNo} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface2, borderRadius: 6, padding: "5px 10px", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.red, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{s.title}</span>
                      <span style={{ fontSize: 11, color: T.text2 }}>{fmtDate(s.targetDate)} · {ddayLabel(s.remainingDays)}</span>
                    </div>
                    <button onClick={() => deleteSchedule(s.ddayNo)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><Icon name="x" size={13} color={T.text3} /></button>
                  </div>
                ))}
              </div>}
          </div>
        )}

        {editingPlan && <PlanEditModal plan={editingPlan} onClose={() => setEditingPlan(null)} onSave={savePlan} onDelete={deletePlan} T={T} weekPlan={weekPlan} />}
        {showAdd && <PlannerAddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} T={T} mode={mainTab === "planner" ? "plan" : "schedule"} overlapMsg={planOverlapMsg} />}
      </div>
    </div>
  );
}
