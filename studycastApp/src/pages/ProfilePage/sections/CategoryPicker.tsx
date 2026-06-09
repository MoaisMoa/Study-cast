import type { ProfileCategory } from "@/types/profile";
import { useT } from "@/theme";
import { MAX_CATEGORIES, PROFILE_CATEGORIES } from "@/data/profile";

export interface CategoryPickerProps {
  selected: ProfileCategory[];
  onToggle: (cat: ProfileCategory) => void;
}

export function CategoryPicker({ selected, onToggle }: CategoryPickerProps) {
  const T = useT();
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>
          내 관심 카테고리
        </div>
        <span style={{ fontSize: 12, color: T.text2 }}>
          최대 {MAX_CATEGORIES}개 선택
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {PROFILE_CATEGORIES.map((c) => {
          const active = selected.includes(c);
          const disabled = !active && selected.length >= MAX_CATEGORIES;
          return (
            <div
              key={c}
              onClick={() => {
                if (disabled) return;
                onToggle(c);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${active ? T.red : T.border}`,
                background: active ? "rgba(229,57,53,0.05)" : T.surface,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                userSelect: "none",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `2px solid ${active ? T.red : T.border}`,
                  background: active ? T.red : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {active && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5l2.5 2.5 4-4"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active ? T.red : T.text2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
