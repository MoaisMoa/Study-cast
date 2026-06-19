import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useT } from "@/theme";
import { confirmBillingKey } from "@/services/paymentService";
import type { SubscriptionPlan } from "@/types/payment";
import { PLAN_INFO } from "@/types/payment";

export function PaymentSuccess() {
  const T = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [planLabel, setPlanLabel] = useState("");

  useEffect(() => {
    const authKey     = params.get("authKey");
    const customerKey = params.get("customerKey");
    const plan        = params.get("plan") as SubscriptionPlan | null;

    if (!authKey || !customerKey || !plan) {
      setState("error");
      return;
    }

    setPlanLabel(PLAN_INFO[plan]?.label ?? plan);

    confirmBillingKey({ authKey, customerKey, plan })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 24,
    }}>
      {state === "loading" && (
        <>
          <div style={{ fontSize: 32 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>결제 처리 중...</div>
          <div style={{ fontSize: 14, color: T.text3 }}>잠시만 기다려주세요.</div>
        </>
      )}

      {state === "success" && (
        <>
          <div style={{ fontSize: 48 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>구독이 시작되었습니다!</div>
          <div style={{ fontSize: 14, color: T.text3 }}>{planLabel} 구독이 완료되었습니다.</div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={() => navigate("/subscription")}
              style={{
                padding: "10px 22px", borderRadius: 10,
                border: `1.5px solid ${T.border}`,
                background: "none", color: T.text2,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              구독 정보 보기
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "10px 22px", borderRadius: 10,
                border: "none", background: T.red,
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              홈으로 가기
            </button>
          </div>
        </>
      )}

      {state === "error" && (
        <>
          <div style={{ fontSize: 48 }}>❌</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>결제 처리에 실패했습니다.</div>
          <div style={{ fontSize: 14, color: T.text3 }}>다시 시도하거나 고객센터에 문의해주세요.</div>
          <button
            onClick={() => navigate("/subscription")}
            style={{
              marginTop: 8,
              padding: "10px 28px", borderRadius: 10,
              border: "none", background: T.red,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            구독 페이지로 돌아가기
          </button>
        </>
      )}
    </div>
  );
}
