import { useRef, useState } from "react";
import type { RoomCategory, VisitedStatusFilter, VisitedTab } from "@/types/visitedRoom";
import { useT } from "@/theme";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Icon } from "@/components/ui/Icon";

const CAT_OPTS = ["어학", "공무원", "개발·IT", "자격증", "취업·면접", "대학생"] as const;
const STATUS_OPTS: VisitedStatusFilter[] = ["전체", "입장 가능", "정원 마감", "운영 종료"];

const TABS: Array<{ key: VisitedTab; label: string }> = [
  { key: "recent", label: "최근 방문한 방" },
  { key: "frequent", label: "자주 방문한 방" },
];

export interface FilterRowProps {
  tab: VisitedTab;
  onTabChange: (t: VisitedTab) => void;
  catFilter: RoomCategory[];
  setCatFilter: (c: RoomCategory[]) => void;
  statusFilter: VisitedStatusFilter;
  setStatusFilter: (s: VisitedStatusFilter) => void;
}

export function FilterRow({
  tab, onTabChange, catFilter, setCatFilter, statusFilter, setStatusFilter,
}: FilterRowProps) {
  const T = useT();

  const [catOpen, setCatOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  useClickOutside(catRef, () => setCatOpen(false), catOpen);
  useClickOutside(statusRef, () => setStatusOpen(false), statusOpen);

  const selCats = catFilter;
  const toggleCat = (c: RoomCategory) =>
    setCatFilter(catFilter.includes(c) ? catFilter.filter((x) => x !== c) : [...catFilter, c]);

  const dropModalStyle = (width: number): React.CSSProperties => ({
    position: "absolute",
    right: 0,
    top: "calc(100% + 10px)",
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 14,
    boxShadow: T.shadowModal,
    zIndex: 300,
    overflow: "hidden",
    width,
  });

  const DropBtn = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", fontSize: 14, color: isActive ? T.text : T.text2, cursor: "pointer", fontWeight: isActive ? 600 : 400, padding: "4px 2px" }}
    >
      {label}
      <Icon name="chevDown" size={14} color={T.text3} />
    </button>
  );

  const Dropdowns = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div ref={catRef} style={{ position: "relative" }}>
        <DropBtn label="관심 카테고리" isActive={selCats.length > 0} onClick={() => { setCatOpen((v) => !v); setStatusOpen(false); }} />
        {catOpen && (
          <div style={dropModalStyle(160)}>
            <div style={{ padding: "10px 10px 10px" }}>
              {selCats.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <button onClick={() => setCatFilter([])} style={{ fontSize: 11, color: T.text3, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, padding: 0 }}>
                    <Icon name="x" size={10} color={T.text3} />전체 해제
                  </button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {CAT_OPTS.map((c) => {
                  const sel = selCats.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCat(c)}
                      style={{ padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${sel ? T.red : T.border}`, background: sel ? T.redLight : T.bg, color: sel ? T.red : T.text2, fontWeight: sel ? 700 : 400, fontSize: 12, cursor: "pointer", transition: "all 0.15s", textAlign: "left", display: "flex", alignItems: "center", gap: 5 }}
                    >
                      {sel && <Icon name="check" size={11} color={T.red} strokeWidth={2.5} />}{c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ width: 1, height: 18, background: T.borderStrong }} />
      <div ref={statusRef} style={{ position: "relative" }}>
        <DropBtn label={statusFilter} isActive={statusFilter !== "전체"} onClick={() => { setStatusOpen((v) => !v); setCatOpen(false); }} />
        {statusOpen && (
          <div style={dropModalStyle(160)}>
            <div style={{ padding: "10px 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              {STATUS_OPTS.map((opt) => {
                const sel = statusFilter === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => { setStatusFilter(opt); setStatusOpen(false); }}
                    style={{ padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${sel ? T.red : T.border}`, background: sel ? T.redLight : T.bg, color: sel ? T.red : T.text2, fontWeight: sel ? 700 : 400, fontSize: 12, cursor: "pointer", transition: "all 0.15s", textAlign: "left", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    {sel && <Icon name="check" size={11} color={T.red} strokeWidth={2.5} />}{opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              style={{ padding: "7px 18px", borderRadius: 20, border: `1.5px solid ${active ? T.text : T.borderStrong}`, background: active ? T.text : "none", color: active ? (T.dark ? "#1a1a1a" : "#fff") : T.text2, fontWeight: active ? 700 : 400, fontSize: 14, transition: "all 0.15s", cursor: "pointer" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {Dropdowns}
    </div>
  );
}
