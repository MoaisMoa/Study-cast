package com.younghee.studycast.domain;

public enum SubscriptionPlan {

    ONE_MONTH("1개월권", 4900, 1),
    THREE_MONTHS("3개월권", 13900, 3),
    SIX_MONTHS("6개월권", 26900, 6);

    private final String displayName;
    private final int amount;
    private final int months;

    SubscriptionPlan(String displayName, int amount, int months) {
        this.displayName = displayName;
        this.amount = amount;
        this.months = months;
    }

    public String getDisplayName() { return displayName; }
    public int getAmount()         { return amount; }
    public int getMonths()         { return months; }
}
