package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSubscriptionDTO {
    private Long          subscriptionId;
    private UUID          userUuid;
    private String        plan;
    private String        billingKey;
    private String        customerKey;
    private String        status;
    private LocalDateTime startedAt;
    private LocalDateTime nextBillingAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
