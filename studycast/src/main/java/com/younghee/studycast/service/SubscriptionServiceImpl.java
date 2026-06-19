package com.younghee.studycast.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.PaymentHistoryMapper;
import com.younghee.studycast.dao.UserSubscriptionMapper;
import com.younghee.studycast.domain.SubscriptionPlan;
import com.younghee.studycast.domain.SubscriptionStatus;
import com.younghee.studycast.dto.PaymentHistoryDTO;
import com.younghee.studycast.dto.UserSubscriptionDTO;
import com.younghee.studycast.dto.request.BillingAuthRequest;
import com.younghee.studycast.dto.response.SubscriptionStatusResponse;
import com.younghee.studycast.dto.response.TossBillingKeyResponse;
import com.younghee.studycast.dto.response.TossPaymentResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final UserSubscriptionMapper subscriptionMapper;
    private final PaymentHistoryMapper   paymentHistoryMapper;
    private final TossPaymentsService    tossPaymentsService;

    @Override
    @Transactional(readOnly = true)
    public boolean isActive(UUID userUuid) {
        return subscriptionMapper.findActiveByUserUuid(userUuid) != null;
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionStatusResponse getSubscriptionStatus(UUID userUuid) {
        UserSubscriptionDTO sub = subscriptionMapper.findActiveByUserUuid(userUuid);
        if (sub == null) {
            return SubscriptionStatusResponse.builder().subscribed(false).build();
        }
        SubscriptionPlan plan = SubscriptionPlan.valueOf(sub.getPlan());
        return SubscriptionStatusResponse.builder()
            .subscribed(true)
            .plan(sub.getPlan())
            .status(sub.getStatus())
            .nextBillingAt(sub.getNextBillingAt())
            .startedAt(sub.getStartedAt())
            .cancelledAt(sub.getCancelledAt())
            .amount(plan.getAmount())
            .build();
    }

    @Override
    @Transactional
    public SubscriptionStatusResponse confirmBillingKey(UUID userUuid, BillingAuthRequest request) {
        String customerKey = userUuid.toString();
        SubscriptionPlan plan = SubscriptionPlan.valueOf(request.getPlan());

        // 1. authKey → billingKey 교환
        TossBillingKeyResponse billingKeyRes = tossPaymentsService.issueBillingKey(
            request.getAuthKey(), customerKey
        );

        // 2. 첫 결제
        String orderId = "SUBS-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        TossPaymentResponse paymentRes = tossPaymentsService.charge(
            billingKeyRes.getBillingKey(),
            customerKey,
            plan.getAmount(),
            orderId,
            plan.getDisplayName() + " 구독"
        );

        // 3. 구독 저장
        LocalDateTime now           = LocalDateTime.now();
        LocalDateTime nextBillingAt = now.plusMonths(plan.getMonths());

        UserSubscriptionDTO subscription = UserSubscriptionDTO.builder()
            .userUuid(userUuid)
            .plan(plan.name())
            .billingKey(billingKeyRes.getBillingKey())
            .customerKey(customerKey)
            .status(SubscriptionStatus.ACTIVE.name())
            .startedAt(now)
            .nextBillingAt(nextBillingAt)
            .build();
        subscriptionMapper.insertSubscription(subscription);

        // 4. 결제 내역 저장
        PaymentHistoryDTO history = PaymentHistoryDTO.builder()
            .userUuid(userUuid)
            .subscriptionId(subscription.getSubscriptionId())
            .orderId(orderId)
            .paymentKey(paymentRes.getPaymentKey())
            .amount(plan.getAmount())
            .plan(plan.name())
            .status("SUCCESS")
            .paidAt(now)
            .build();
        paymentHistoryMapper.insertPaymentHistory(history);

        log.info("구독 시작: userUuid={}, plan={}", userUuid, plan.name());

        return SubscriptionStatusResponse.builder()
            .subscribed(true)
            .plan(plan.name())
            .status(SubscriptionStatus.ACTIVE.name())
            .nextBillingAt(nextBillingAt)
            .startedAt(now)
            .amount(plan.getAmount())
            .build();
    }

    @Override
    @Transactional
    public void cancelSubscription(UUID userUuid) {
        UserSubscriptionDTO sub = subscriptionMapper.findActiveByUserUuid(userUuid);
        if (sub == null) {
            throw new NoSuchElementException("활성 구독이 없습니다.");
        }
        subscriptionMapper.updateStatus(
            sub.getSubscriptionId(),
            SubscriptionStatus.CANCELLED.name(),
            LocalDateTime.now()
        );
        log.info("구독 해지: userUuid={}", userUuid);
    }

    @Override
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void processDueBillings() {
        List<UserSubscriptionDTO> dueBillings = subscriptionMapper.findDueBillings();
        for (UserSubscriptionDTO sub : dueBillings) {
            try {
                SubscriptionPlan plan    = SubscriptionPlan.valueOf(sub.getPlan());
                String           orderId = "SUBS-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

                TossPaymentResponse paymentRes = tossPaymentsService.charge(
                    sub.getBillingKey(), sub.getCustomerKey(),
                    plan.getAmount(), orderId,
                    plan.getDisplayName() + " 자동결제"
                );

                subscriptionMapper.updateNextBillingAt(
                    sub.getSubscriptionId(),
                    sub.getNextBillingAt().plusMonths(plan.getMonths())
                );

                paymentHistoryMapper.insertPaymentHistory(PaymentHistoryDTO.builder()
                    .userUuid(sub.getUserUuid())
                    .subscriptionId(sub.getSubscriptionId())
                    .orderId(orderId)
                    .paymentKey(paymentRes.getPaymentKey())
                    .amount(plan.getAmount())
                    .plan(plan.name())
                    .status("SUCCESS")
                    .paidAt(LocalDateTime.now())
                    .build());

                log.info("자동결제 성공: userUuid={}, plan={}", sub.getUserUuid(), plan.name());
            } catch (Exception e) {
                log.error("자동결제 실패: userUuid={}, error={}", sub.getUserUuid(), e.getMessage());
                subscriptionMapper.updateStatus(sub.getSubscriptionId(), SubscriptionStatus.EXPIRED.name(), null);

                paymentHistoryMapper.insertPaymentHistory(PaymentHistoryDTO.builder()
                    .userUuid(sub.getUserUuid())
                    .subscriptionId(sub.getSubscriptionId())
                    .orderId("FAIL-" + System.currentTimeMillis())
                    .amount(SubscriptionPlan.valueOf(sub.getPlan()).getAmount())
                    .plan(sub.getPlan())
                    .status("FAILED")
                    .failedReason(e.getMessage())
                    .build());
            }
        }
    }
}
