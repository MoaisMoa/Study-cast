import type { ConfirmModalState } from "@/types/myStudy";
import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";

export interface ConfirmActionModalProps {
  state: ConfirmModalState | null;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmActionModal({ state, loading, error, onClose, onConfirm }: ConfirmActionModalProps) {
  const T = useT();
  if (!state) return null;

  const isDelete = state.type === "delete";
  const count = state.rooms.length;
  const title = isDelete ? "스터디를 삭제할까요?" : "스터디를 종료할까요?";
  const desc = isDelete
    ? `선택한 ${count}개 스터디가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
    : `선택한 ${count}개 스터디를 종료합니다. 종료된 방은 더 이상 입장할 수 없습니다.`;
  const confirmLabel = isDelete ? "삭제하기" : "종료하기";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
          padding: "28px 24px 20px", width: "100%", maxWidth: 360,
          boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: isDelete ? "#FFEBEE" : "#FFF3E0",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
          }}>
            <Icon name={isDelete ? "trash" : "alertTri"} size={22} color={isDelete ? T.red : "#E65100"} />
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, textAlign: "center" }}>{title}</p>
        </div>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: T.text3, lineHeight: 1.6, textAlign: "left" }}>{desc}</p>

        {error && (
          <p style={{ margin: "0 0 16px", fontSize: 12, color: T.red, lineHeight: 1.6, textAlign: "left" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: `1px solid ${T.border}`, background: "transparent", color: T.text2,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Noto Sans KR',sans-serif",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none",
              background: T.red, color: "#fff",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              fontFamily: "'Noto Sans KR',sans-serif",
            }}
          >
            {loading ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
