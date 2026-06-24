import { useState } from "react";
import type { Theme } from "@/types";
import type { WeekPlan } from "@/data/planner";
import { PLANNER_PASTEL_COLORS, toMinExt } from "@/data/planner";
import { Icon } from "@/components/ui/Icon";

const W_DAYS_LABEL = ["월", "화", "수", "목", "금", "토", "일"];
const START_HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, "0") + ":00");
const END_HOURS = Array.from({ length: 18 }, (_, i) => String(i + 7).padStart(2, "0") + ":00");

export interface PlanEditModalProps {
  plan: WeekPlan;
  onClose: () => void;
  onSave: (plan: WeekPlan) => boolean | void;
  onDelete: (id: number) => void;
  T: Theme;
  weekPlan?: WeekPlan[];
}

/** 주간 계획 수정/삭제 모달 (플래너 탭 내부) */
export function PlanEditModal({ plan, onClose, onSave, onDelete, T, weekPlan = [] }: PlanEditModalProps) {
  const [title, setTitle] = useState(plan.title);
  const [day, setDay] = useState(plan.day);
  const [start, setStart] = useState(plan.start);
  const [end, setEnd] = useState(plan.end);
  const [color, setColor] = useState(plan.color || "#E57373");
  const [editMsg, setEditMsg] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", border: `1.5px solid ${T.border}`, borderRadius: 7,
    padding: "7px 10px", fontSize: 13, outline: "none",
    background: T.bg, color: T.text, colorScheme: T.dark ? "dark" : "light",
  };

  const save = () => {
    if (!title.trim()) return;
    const ns = toMinExt(start), ne = toMinExt(end);
    if (ns >= ne) { setEditMsg("종료 시간은 시작 시간보다 늦어야 합니다."); setTimeout(() => setEditMsg(""), 2500); return; }
    const overlap = weekPlan.some((p) => p.id !== plan.id && p.day === day && toMinExt(p.start) < ne && toMinExt(p.end) > ns);
    if (overlap) { setEditMsg("해당 시간대에 이미 계획이 있습니다."); setTimeout(() => setEditMsg(""), 2500); return; }
    const ok = onSave({ ...plan, title, day, start, end, color });
    if (ok !== false) onClose();
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 16, width: 340, boxShadow: "0 12px 40px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>계획 수정</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><Icon name="x" size={16} color={T.text3} /></button>
        </div>
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 제목 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>제목</div>
              <div style={{ fontSize: 11, color: title.length >= 10 ? T.red : T.text3 }}>{title.length}/10</div>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 10))} style={inputStyle} />
          </div>
          {/* 요일 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>요일</div>
            <div style={{ display: "flex", gap: 4 }}>
              {W_DAYS_LABEL.map((d, i) => (
                <button key={d} onClick={() => setDay(i)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1px solid ${day === i ? T.red : T.border}`, background: day === i ? T.redLight : "none", color: day === i ? T.red : T.text2, fontWeight: day === i ? 700 : 400, fontSize: 12, cursor: "pointer" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          {/* 색상 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>색상</div>
            <div style={{ display: "flex", gap: 6 }}>
              {PLANNER_PASTEL_COLORS.map(({ val }) => (
                <button key={val} onClick={() => setColor(val)}
                  style={{ flex: 1, height: 28, borderRadius: 6, border: color === val ? `2px solid ${T.text}` : "2px solid transparent", background: val, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {color === val && <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,.5)" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
          {/* 시간 */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>시작</div>
              <select value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {START_HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text2, marginBottom: 6 }}>종료</div>
              <select value={end} onChange={(e) => setEnd(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {END_HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          {editMsg && <div style={{ fontSize: 12, color: T.red, textAlign: "center", padding: "6px 10px", background: "rgba(229,57,53,.12)", borderRadius: 7, border: "1px solid rgba(229,57,53,.25)" }}>{editMsg}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onDelete(plan.id); onClose(); }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: `1.5px solid ${T.red}`, background: "none", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              삭제
            </button>
            <button onClick={save}
              style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", background: title.trim() ? T.red : "#e0e0e0", color: title.trim() ? "#fff" : "#9e9e9e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              수정 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
