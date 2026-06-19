package com.younghee.studycast.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.request.BillingAuthRequest;
import com.younghee.studycast.dto.response.SubscriptionStatusResponse;
import com.younghee.studycast.service.SubscriptionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentController {

    private final SubscriptionService subscriptionService;

    // 구독 상태 조회
    @GetMapping("/subscription")
    public ResponseEntity<SubscriptionStatusResponse> getSubscriptionStatus(Authentication authentication) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionStatus(getUserUuid(authentication)));
    }

    // 빌링키 확인 + 최초 결제 + 구독 시작
    @PostMapping("/billing-key")
    public ResponseEntity<SubscriptionStatusResponse> confirmBillingKey(
        @RequestBody BillingAuthRequest request,
        Authentication authentication
    ) {
        return ResponseEntity.ok(subscriptionService.confirmBillingKey(getUserUuid(authentication), request));
    }

    // 구독 해지
    @DeleteMapping("/subscription")
    public ResponseEntity<Void> cancelSubscription(Authentication authentication) {
        subscriptionService.cancelSubscription(getUserUuid(authentication));
        return ResponseEntity.noContent().build();
    }

    private UUID getUserUuid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        return (UUID) authentication.getPrincipal();
    }
}
