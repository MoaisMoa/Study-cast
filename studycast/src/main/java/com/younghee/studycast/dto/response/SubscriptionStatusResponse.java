package com.younghee.studycast.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionStatusResponse {
    private boolean       subscribed;
    private String        plan;
    private String        status;
    private LocalDateTime nextBillingAt;
    private LocalDateTime startedAt;
    private LocalDateTime cancelledAt;
    private int           amount;
}
