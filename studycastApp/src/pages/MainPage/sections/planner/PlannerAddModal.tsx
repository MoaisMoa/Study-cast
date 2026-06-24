import { useState } from "react";
import type { Theme } from "@/types";
import { PLANNER_CAT_COLOR, PLANNER_PASTEL_COLORS } from "@/data/planner";
import { Icon } from "@/components/ui/Icon";

const W_DAYS_LABEL = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, "0") + ":00"); // 06~23
const END_HOURS = Array.from({ length: 18 }, (_, i) => String(i + 7).padStart(2, "0") + ":00"); // 07~24

export type AddMode = "schedule" | "plan";

export interface SchedulePayload {
  title: string; dateRaw: string; date: string; dday: number; type: string;
}
export interface PlanPayload {
  title: string; day: number; cat: string; color: string; start: string; end: string;
}

export interface PlannerAddModalProps {
  onClose: () => void;
  onAdd: (payload: SchedulePayload | PlanPayload) => boolean | void;
  T: Theme;
  mode?: AddMode;
  overlapMsg?: string;
}

/** 일정 등록(캘린더) / 계획 추가(플래너) 공용 모달 */
export function PlannerAddModal({ onClose, onAdd, T, mode = "schedule", overlapMsg = "" }: PlannerAddModalProps) {
  const CAT_LIST = Object.keys(PLANNER_CAT_COLOR);

  // 캘린더 모드
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("시험");
  const today = new Date().toISOString().slice(0, 10);
  const dday = date ? Math.ceil((new Date(date).getTime() - new Date(today).getTime()) / 86400000) : null;

  // 플래너 모드
  const [pTitle, setPTitle] = useState("");
  // 요일 기본값: 오늘 (W_DAYS_LABEL은 월요일이 0번 인덱스라 Date.getDay()의 일요일=0 기준을 보정)
  const [pDay, setPDay] = useState(() => (new Date().getDay() + 6) % 7);
  const [pColor, setPColor] = useState("#E57373");
  const [pStart, setPStart] = useState("09:00");
  const [pEnd, setPEnd] = useState("10:00");

  const inputStyle: React.CSSProperties = {
    width: "100%", border: `1.5px solid ${T.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, outline: "none",
    background: T.bg, color: T.text, colorScheme: T.dark ? "dark" : "light",
  };

  const submitSchedule = () => {
    if (!title.trim() || !date) return;
    const d = new Date(date);
    onAdd({ title, dateRaw: date, date: `${d.getMonth() + 1}월 ${d.getDate()}일`, dday: Math.max(0, dday ?? 0), type });
    onClose();
  };
  const submitPlan = () => {
    if (!pTitle.trim()) return;
    const ok = onAdd({ title: pTitle, day: pDay, cat: CAT_LIST[0], color: pColor, start: pStart, end: pEnd });
    if (ok !== false) onClose();
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 16, width: 340, boxShadow: "0 12px 40px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{mode === "plan" ? "계획 추가" : "일정 등록"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><Icon name="x" size={16} color={T.text3} /></button>
        </div>
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "plan" ? (
            <>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>제목</div>
                  <div style={{ fontSize: 11, color: pTitle.length >= 10 ? T.red : T.text3 }}>{pTitle.length}/10</div>
                </div>
                <input value={pTitle} onChange={(e) => setPTitle(e.target.value.slice(0, 10))} placeholder="최대 10자" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>요일</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {W_DAYS_LABEL.map((d, i) => (
                    <button key={d} onClick={() => setPDay(i)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1px solid ${pDay === i ? T.red : T.border}`, background: pDay === i ? T.redLight : "none", color: pDay === i ? T.red : T.text2, fontWeight: pDay === i ? 700 : 400, fontSize: 12, cursor: "pointer" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>색상</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {PLANNER_PASTEL_COLORS.map(({ val }) => (
                    <button key={val} onClick={() => setPColor(val)}
                      style={{ flex: 1, height: 28, borderRadius: 6, border: pColor === val ? `2px solid ${T.text}` : "2px solid transparent", background: val, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {pColor === val && <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,.5)" }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>시작</div>
                  <select value={pStart} onChange={(e) => setPStart(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {START_HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>종료</div>
                  <select value={pEnd} onChange={(e) => setPEnd(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {END_HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              {overlapMsg && <div style={{ fontSize: 12, color: T.red, textAlign: "center", padding: "6px 10px", background: "rgba(229,57,53,.12)", borderRadius: 7, border: "1px solid rgba(229,57,53,.25)" }}>{overlapMsg}</div>}
              <button onClick={submitPlan}
                style={{ width: "100%", padding: "10px 0", borderRadius: 9, border: "none", background: pTitle.trim() ? T.red : "#e0e0e0", color: pTitle.trim() ? "#fff" : "#9e9e9e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                추가하기
              </button>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>일정 유형</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["시험", "과제", "모임", "기타"].map((t) => (
                    <button key={t} onClick={() => setType(t)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1px solid ${type === t ? T.red : T.border}`, background: type === t ? T.redLight : "none", color: type === t ? T.red : T.text2, fontWeight: type === t ? 700 : 400, fontSize: 12, cursor: "pointer" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>제목</div>
                  <div style={{ fontSize: 11, color: title.length >= 10 ? T.red : T.text3 }}>{title.length}/10</div>
                </div>
                <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 10))} placeholder="최대 10자" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>날짜</div>
                <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
              </div>
              {dday !== null && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface2, borderRadius: 8, padding: "8px 12px" }}>
                  <span style={{ fontSize: 12, color: T.text2 }}>D-day</span>
                  <span style={{ fontWeight: 700, color: dday <= 0 ? T.red : T.text, fontFamily: "monospace", fontSize: 14 }}>{dday <= 0 ? "D-day" : "D-" + dday}</span>
                </div>
              )}
              <button onClick={submitSchedule}
                style={{ width: "100%", padding: "10px 0", borderRadius: 9, border: "none", background: title.trim() && date ? T.red : "#e0e0e0", color: title.trim() && date ? "#fff" : "#9e9e9e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                일정 등록하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
