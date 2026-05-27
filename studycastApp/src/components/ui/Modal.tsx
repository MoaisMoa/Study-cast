import type { CSSProperties, ReactNode } from "react";
import { useT } from "@/theme";
import { Icon } from "./Icon";

/**
 * 드롭다운 형태의 인라인 모달 컨테이너 (Browse 필터에서 사용).
 * `anchor` 없이 `position: absolute`로 상대 컨테이너에 종속.
 */
export interface DropdownModalProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function DropdownModal({ children, style }: DropdownModalProps) {
  const T = useT();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: "calc(100% + 10px)",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        boxShadow: T.shadowModal,
        zIndex: 300,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface DropdownModalHeaderProps {
  title: string;
  onClear?: (() => void) | null;
}

export function DropdownModalHeader({ title, onClear }: DropdownModalHeaderProps) {
  const T = useT();
  return (
    <div style={{
      padding: "14px 16px 10px",
      borderBottom: `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</span>
      {onClear && (
        <button
          onClick={onClear}
          style={{
            fontSize: 11,
            color: T.text3,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: 0,
          }}
        >
          <Icon name="x" size={10} color={T.text3} />
          전체 해제
        </button>
      )}
    </div>
  );
}

/** 풀스크린 다이얼로그 컨테이너 (RoomCreate 확인 모달) */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Dialog({ open, onClose, children, width = 360 }: DialogProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 20px",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: width }}>
        {children}
      </div>
    </div>
  );
}
