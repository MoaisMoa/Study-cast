import { useT } from "@/theme";
import type { SortValue, StatusFilter, VisibilityFilter } from "@/types/myStudy";
import { SORT_OPTIONS, STATUS_FILTERS, VISIBILITY_FILTERS } from "@/data/myStudy";
import { DropdownButton } from "../components/DropdownButton";

export interface MyStudyToolbarProps {
  isMobile: boolean;
  sortBy: SortValue;
  onSortChange: (v: SortValue) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  visibilityFilter: VisibilityFilter;
  onVisibilityChange: (v: VisibilityFilter) => void;
}

export function MyStudyToolbar({
  isMobile, sortBy, onSortChange, statusFilter, onStatusChange, visibilityFilter, onVisibilityChange,
}: MyStudyToolbarProps) {
  const T = useT();
  return (
    <div style={{
      marginBottom: isMobile ? 16 : 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <DropdownButton
        align="left"
        options={SORT_OPTIONS}
        value={sortBy}
        onChange={(v) => onSortChange(v as SortValue)}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginLeft: 4 }}>
        <DropdownButton
          label="운영 상태"
          align="right"
          options={STATUS_FILTERS.map((s) => ({ value: s, label: s }))}
          value={statusFilter}
          neutralValue="전체"
          onChange={(v) => onStatusChange(v as StatusFilter)}
        />
        <div style={{ width: 1, height: 14, background: T.border, margin: isMobile ? "0 8px" : "0 10px" }} />
        <DropdownButton
          label="공개"
          align="right"
          options={VISIBILITY_FILTERS.map((s) => ({ value: s, label: s }))}
          value={visibilityFilter}
          neutralValue="전체"
          onChange={(v) => onVisibilityChange(v as VisibilityFilter)}
        />
      </div>
    </div>
  );
}
