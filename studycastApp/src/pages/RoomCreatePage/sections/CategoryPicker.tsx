import type { RoomCategory } from "@/types";
import { useRT } from "@/theme";
import { CATS_FILTER } from "@/data/categories";

export interface CategoryPickerProps {
  value: RoomCategory[];
  onChange: (next: RoomCategory[]) => void;
  isMobile: boolean;
}

/**
 * 관심 카테고리 1개 선택 토글.
 *
 * 값은 메인페이지 필터(`CATS_FILTER`)와 동일한 `RoomCategory` 를 그대로 사용한다.
 * 같은 카테고리 다시 클릭 시 선택 해제(빈 배열).
 */
export function CategoryPicker({ value, onChange, isMobile: _isMobile }: CategoryPickerProps) {
  const T = useRT();
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 8,
    }}>
      {CATS_FILTER.map((cat) => {
        const active = value.includes(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(active ? [] : [cat])}
            style={{
              padding: "10px 0",
              fontSize: 13,
              fontWeight: active ? 700 : 400,
              borderRadius: 8,
              textAlign: "center",
              border: active ? `1.5px solid ${T.red}` : `1px solid ${T.border}`,
              background: active ? "rgba(230,50,50,0.08)" : T.surface2,
              color: active ? T.red : T.muted,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
