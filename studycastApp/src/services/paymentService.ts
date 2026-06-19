import apiClient from "@/services/apiClient";
import type { BillingAuthConfirmRequest, SubscriptionStatusResponse, SubscriptionPlan } from "@/types/payment";

export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const { data } = await apiClient.get<SubscriptionStatusResponse>("/api/payments/subscription");
  return data;
}

export async function confirmBillingKey(
  request: BillingAuthConfirmRequest
): Promise<SubscriptionStatusResponse> {
  const { data } = await apiClient.post<SubscriptionStatusResponse>(
    "/api/payments/billing-key",
    request
  );
  return data;
}

export async function cancelSubscription(): Promise<void> {
  await apiClient.delete("/api/payments/subscription");
}

export async function requestBillingAuth(
  plan: SubscriptionPlan,
  customerKey: string,
  userEmail: string,
  tossClientKey: string
): Promise<void> {
  // Toss JS SDK 동적 로드
  await new Promise<void>((resolve, reject) => {
    if ((window as any).TossPayments) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("토스페이먼츠 스크립트 로드 실패"));
    document.head.appendChild(script);
  });

  const toss = (window as any).TossPayments(tossClientKey);
  toss.requestBillingAuth("카드", {
    customerKey,
    successUrl: `${window.location.origin}/payments/success?plan=${plan}`,
    failUrl:    `${window.location.origin}/payments/fail`,
    customerEmail: userEmail,
  });
}
