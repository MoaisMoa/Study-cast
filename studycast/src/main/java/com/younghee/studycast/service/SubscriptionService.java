package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.request.BillingAuthRequest;
import com.younghee.studycast.dto.response.SubscriptionStatusResponse;

public interface SubscriptionService {
    boolean isActive(UUID userUuid);
    SubscriptionStatusResponse getSubscriptionStatus(UUID userUuid);
    SubscriptionStatusResponse confirmBillingKey(UUID userUuid, BillingAuthRequest request);
    void cancelSubscription(UUID userUuid);
    void processDueBillings();
}
