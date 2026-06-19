package com.younghee.studycast.service;

import com.younghee.studycast.dto.response.TossBillingKeyResponse;
import com.younghee.studycast.dto.response.TossPaymentResponse;

public interface TossPaymentsService {
    TossBillingKeyResponse issueBillingKey(String authKey, String customerKey);
    TossPaymentResponse charge(String billingKey, String customerKey, int amount, String orderId, String orderName);
}
