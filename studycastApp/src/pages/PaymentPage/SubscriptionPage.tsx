import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getSubscriptionStatus, cancelSubscription, requestBillingAuth } from "@/services/paymentService";
import type { SubscriptionStatusResponse, SubscriptionPlan } from "@/types/payment";
import { PLAN_INFO } from "@/types/payment";

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY ?? "";

function fmt(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function SubscriptionPage() {
  const T = useT();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<SubscriptionPlan | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    getSubscriptionStatus()
      .then(setStatus)
      .catch(() => setError("구독 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user?.userUuid) { setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요."); return; }
    setSubscribing(plan);
    setError(null);
    try {
      await requestBillingAuth(plan, user.userUuid, user.email, TOSS_CLIENT_KEY);
    } catch {
      setError("결제 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.");
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("구독을 해지하시겠습니까?\n현재 결제 기간 종료 후 자동결제가 중단됩니다.")) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      setStatus((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
    } catch {
      setError("구독 해지에 실패했습니다.");
    } finally {
      setCancelling(false);
    }
  };

  const planOrder: SubscriptionPlan[] = ["ONE_MONTH", "THREE_MONTHS", "SIX_MONTHS"];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      {/* 헤더 */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 18 }}
        >
          ←
        </button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>구독 플랜</span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>

        {/* 현재 구독 상태 */}
        {!loading && status?.subscribed && (
          <div style={{
            background: T.surface,
            border: `1.5px solid ${T.red}`,
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 36,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: T.text3, marginBottom: 4 }}>현재 구독 중</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>
                  {PLAN_INFO[status.plan!]?.label ?? status.plan}
                </div>
                <div style={{ fontSize: 13, color: T.text2, marginTop: 4 }}>
                  다음 결제일: {fmt(status.nextBillingAt)}
                  {status.status === "CANCELLED" && (
                    <span style={{ marginLeft: 8, color: T.red, fontWeight: 600 }}>· 해지 예약됨</span>
                  )}
                </div>
              </div>
              {status.status === "ACTIVE" && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{
                    padding: "8px 18px", borderRadius: 8,
                    border: `1.5px solid ${T.border}`,
                    background: "none", color: T.text3,
                    fontSize: 13, cursor: cancelling ? "not-allowed" : "pointer",
                    opacity: cancelling ? 0.6 : 1,
                  }}
                >
                  {cancelling ? "처리 중..." : "구독 해지"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            스터디룸 구독권
          </div>
          <div style={{ fontSize: 14, color: T.text3, lineHeight: 1.7 }}>
            구독 시 최대 <strong>8인</strong> 스터디룸 생성 가능<br />
            매달 자동결제되며 언제든 해지할 수 있습니다.
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{
            background: "#FFF3F3", border: `1px solid ${T.red}`,
            borderRadius: 8, padding: "12px 16px",
            color: T.red, fontSize: 13, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {/* 플랜 카드 */}
        {loading ? (
          <div style={{ textAlign: "center", color: T.text3, padding: "40px 0" }}>로딩 중...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {planOrder.map((plan) => {
              const info = PLAN_INFO[plan];
              const isActive = status?.subscribed && status.plan === plan;
              const isBest = plan === "THREE_MONTHS";

              return (
                <div
                  key={plan}
                  style={{
                    background: T.surface,
                    border: `2px solid ${isActive ? T.red : isBest ? T.red + "66" : T.border}`,
                    borderRadius: 16,
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    transition: "border-color 0.15s",
                  }}
                >
                  {/* 뱃지 */}
                  {isBest && !isActive && (
                    <div style={{
                      position: "absolute", top: -12,
                      background: T.red, color: "#fff",
                      fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 20,
                    }}>
                      인기
                    </div>
                  )}
                  {isActive && (
                    <div style={{
                      position: "absolute", top: -12,
                      background: T.red, color: "#fff",
                      fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 20,
                    }}>
                      현재 구독 중
                    </div>
                  )}

                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{info.label}</div>

                  {/* 할인율 뱃지 */}
                  {info.discountPct && (
                    <div style={{
                      background: "#FFF3E0", color: "#E65100",
                      fontSize: 11, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 20,
                      marginBottom: 12,
                    }}>
                      {info.discountPct}% 할인
                    </div>
                  )}
                  {!info.discountPct && <div style={{ height: 26, marginBottom: 12 }} />}

                  <div style={{ fontSize: 28, fontWeight: 900, color: T.red, lineHeight: 1 }}>
                    {info.amount.toLocaleString()}
                    <span style={{ fontSize: 14, fontWeight: 500, color: T.text3 }}>원</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.text3, marginTop: 4, marginBottom: 20 }}>
                    {info.months}개월 · 월 {info.monthlyAmount.toLocaleString()}원
                  </div>

                  <button
                    onClick={() => !isActive && handleSubscribe(plan)}
                    disabled={!!isActive || subscribing === plan || status?.subscribed}
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      borderRadius: 10,
                      border: "none",
                      background: isActive ? T.surface2 : (status?.subscribed ? T.surface2 : T.red),
                      color: isActive || status?.subscribed ? T.text3 : "#fff",
                      fontSize: 14, fontWeight: 700,
                      cursor: (isActive || status?.subscribed || subscribing === plan) ? "not-allowed" : "pointer",
                      opacity: subscribing === plan ? 0.7 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {isActive ? "구독 중" : subscribing === plan ? "결제창 열기..." : "구독하기"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: T.text3, lineHeight: 1.8 }}>
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.<br />
          구독 해지 후에도 현재 결제 기간 종료일까지 이용 가능합니다.
        </div>
      </div>
    </div>
  );
}
