import { useRef, useState } from "react";
import { useT } from "@/theme";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Icon } from "@/components/ui/Icon";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownButtonProps {
  /** 버튼 라벨 prefix (예: "운영 상태"). 정렬 버튼은 생략 가능 */
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (next: string) => void;
  /** value 가 이 값이면 "비활성(전체)" 취급해 prefix만 표시 */
  neutralValue?: string;
  /** 드롭다운 정렬 방향 */
  align?: "left" | "right";
}

/**
 * 텍스트 + chevron 토글 드롭다운 — 정렬/필터 공용.
 * (원본 MobileSortButton / MobileFilterButton 통합)
 */
export function DropdownButton({
  label, options, value, onChange, neutralValue, align = "left",
}: DropdownButtonProps) {
  const T = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const current = options.find((o) => o.value === value);
  const isActive = neutralValue != null ? value !== neutralValue : false;
  const accent = open || isActive;

  // 표시 텍스트: label 있으면 "label: value"(활성) 또는 "label"(비활성), 없으면 현재 라벨
  const text = label
    ? isActive
      ? `${label}: ${current?.label ?? value}`
      : label
    : current?.label ?? "";

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 0",
          border: "none",
          background: "none",
          color: accent ? T.red : T.text2,
          fontSize: 14,
          fontWeight: isActive ? 700 : 500,
          cursor: "pointer",
          fontFamily: "'Noto Sans KR',sans-serif",
        }}
      >
        {text}
        <Icon name="chevDown" size={14} color={accent ? T.red : T.text3} />
      </button>
      {open && (
        <div style={{
          position: "absolute",
          [align]: 0,
          top: "calc(100% + 6px)",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          boxShadow: T.shadowModal,
          overflow: "hidden",
          zIndex: 200,
          minWidth: 120,
        }}>
          <div style={{ padding: "10px 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
            {options.map((opt) => {
              const sel = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1.5px solid ${sel ? T.red : T.border}`,
                    background: sel ? T.redLight : T.bg,
                    color: sel ? T.red : T.text2,
                    fontWeight: sel ? 700 : 400,
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                >
                  {sel && <Icon name="check" size={11} color={T.red} strokeWidth={2.5} />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
