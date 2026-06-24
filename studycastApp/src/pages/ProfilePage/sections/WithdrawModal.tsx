import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/theme";
import { Dialog } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { withdraw } from "@/services/profileService";
import { forceLeaveActiveRoom } from "@/utils/roomSession";
import { EyeButton } from "../components/EyeButton";

export interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const T = useT();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const ff = "'Noto Sans KR', sans-serif";

  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setPw("");
    setShow(false);
    setError("");
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!pw) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await withdraw({ password: pw });
      if (!result.ok) {
        if (result.errorCode === "wrong_password") {
          setError(result.message ?? "현재 비밀번호가 일치하지 않습니다.");
        } else {
          setError(result.message ?? "탈퇴 처리 중 오류가 발생했습니다.");
        }
        return;
      }
      // 성공: 접속 중인 스터디룸이 있으면 자동으로 나가기 처리 후 로그아웃 + 로그인 페이지로 이동
      forceLeaveActiveRoom();
      reset();
      onClose();
      logout();
      navigate("/login");
    } catch {
      setError("탈퇴 처리 중 오류가 발생했습니다.");
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
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: T.text,
            marginBottom: 8,
          }}
        >
          정말 탈퇴하시겠어요?
        </div>
        <div
          style={{
            fontSize: 14,
            color: T.text2,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          탈퇴 시 계정이 비활성화되며 30일 후 완전 삭제됩니다.
          <br />계속하려면 현재 비밀번호를 입력해 주세요.
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.text2, marginBottom: 6 }}>
            현재 비밀번호
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError("");
              }}
              placeholder="비밀번호를 입력해 주세요"
              style={{
                width: "100%",
                height: 44,
                padding: "0 40px 0 14px",
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
              onFocus={(e) => {
                e.target.style.borderColor = T.red;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? T.red : T.border;
              }}
            />
            <EyeButton visible={show} onToggle={() => setShow((v) => !v)} />
          </div>
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
              background: "none",
              border: `1px solid ${T.red}`,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              color: T.red,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: ff,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = T.red;
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = T.red;
            }}
          >
            {loading ? "처리 중..." : "탈퇴하기"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
