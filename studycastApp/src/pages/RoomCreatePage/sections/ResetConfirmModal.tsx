import { useRT } from "@/theme";
import { Dialog } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

export interface ResetConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetConfirmModal({ open, onClose, onConfirm }: ResetConfirmModalProps) {
  const T = useRT();
  return (
    <Dialog open={open} onClose={onClose}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "28px 24px 20px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "#FFEBEE",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
          }}>
            <Icon name="alertTri" size={22} color={T.red} />
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text, textAlign: "center" }}>
            입력 내용을 초기화할까요?
          </p>
        </div>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: T.muted, lineHeight: 1.6, textAlign: "left" }}>
          입력한 모든 내용이 초기 상태로 되돌아갑니다.<br />이 작업은 되돌릴 수 없습니다.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "9px 0",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.muted,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "9px 0",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: T.red,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            초기화
          </button>
        </div>
      </div>
    </Dialog>
  );
}
