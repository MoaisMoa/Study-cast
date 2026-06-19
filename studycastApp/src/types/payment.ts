export type SubscriptionPlan = "ONE_MONTH" | "THREE_MONTHS" | "SIX_MONTHS";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

export interface SubscriptionStatusResponse {
  subscribed: boolean;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  nextBillingAt: string | null;
  startedAt: string | null;
  cancelledAt: string | null;
  amount: number;
}

export interface BillingAuthConfirmRequest {
  authKey: string;
  customerKey: string;
  plan: SubscriptionPlan;
}

export interface PlanInfo {
  label: string;
  amount: number;
  months: number;
  monthlyAmount: number;
  discountPct: number | null;
}

export const PLAN_INFO: Record<SubscriptionPlan, PlanInfo> = {
  ONE_MONTH:    { label: "1개월권", amount: 4900,  months: 1, monthlyAmount: 4900,  discountPct: null },
  THREE_MONTHS: { label: "3개월권", amount: 13900, months: 3, monthlyAmount: 4633,  discountPct: 5   },
  SIX_MONTHS:   { label: "6개월권", amount: 26900, months: 6, monthlyAmount: 4483,  discountPct: 8   },
};
