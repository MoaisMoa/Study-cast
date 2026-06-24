import { useState } from "react";
import { useT } from "@/theme";
import { Dialog } from "@/components/ui/Modal";
import { isNameValid } from "@/utils/validators";
import { changeName } from "@/services/profileService";

export interface NameChangeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newName: string) => void;
}

export function NameChangeModal({ open, onClose, onSuccess }: NameChangeModalProps) {
  const T = useT();
  const ff = "'Noto Sans KR', sans-serif";

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setError("");
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!name) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!isNameValid(name)) {
      setError("한글 2~5자 이내로 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await changeName(name);
      if (!result.ok) {
        setError(result.message ?? "이름 변경 처리 중 오류가 발생했습니다.");
        return;
      }
      const newName = name;
      reset();
      onClose();
      onSuccess(newName);
    } catch {
      setError("이름 변경 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} width={380}>
      <div
        style={{
          background: T.surface,
          borderRadius: 12,
          padding: 28,
          boxShadow: T.shadowHover,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>
          이름 변경
        </div>
        <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, marginBottom: 20, wordBreak: "keep-all" }}>
          소셜 로그인으로 등록된 이름은 <b style={{ color: T.text }}>최초 1회만</b> 변경할 수 있어요. 변경 후에는 다시 수정할 수 없으니 신중하게 입력해 주세요.
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.text2, marginBottom: 6 }}>새 이름</div>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="한글 2~5자"
            style={{
              width: "100%",
              height: 44,
              padding: "0 14px",
              border: `1px solid ${error ? T.red : T.border}`,
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              background: T.bg,
              color: T.text,
              fontFamily: ff,
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: T.red, marginTop: 4 }}>{error}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              flex: 1,
              height: 44,
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: T.text2,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: ff,
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              height: 44,
              background: T.red,
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: ff,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "변경 중..." : "변경하기"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
