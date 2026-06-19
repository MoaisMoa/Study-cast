import { useNavigate, useSearchParams } from "react-router-dom";
import { useT } from "@/theme";

export function PaymentFail() {
  const T = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const code    = params.get("code");
  const message = params.get("message");

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      padding: 24,
    }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>결제가 취소되었습니다.</div>
      {message && (
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: "10px 20px",
          fontSize: 13,
          color: T.text2,
          maxWidth: 360,
          textAlign: "center",
        }}>
          {code && <span style={{ fontWeight: 600 }}>[{code}] </span>}
          {message}
        </div>
      )}
      <button
        onClick={() => navigate("/subscription")}
        style={{
          marginTop: 8,
          padding: "11px 28px", borderRadius: 10,
          border: "none", background: T.red,
          color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
      >
        다시 시도하기
      </button>
    </div>
  );
}
