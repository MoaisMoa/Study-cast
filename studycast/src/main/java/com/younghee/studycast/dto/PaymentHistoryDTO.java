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
public class PaymentHistoryDTO {
    private Long          paymentId;
    private UUID          userUuid;
    private Long          subscriptionId;
    private String        orderId;
    private String        paymentKey;
    private int           amount;
    private String        plan;
    private String        status;
    private LocalDateTime paidAt;
    private String        failedReason;
    private LocalDateTime createdAt;
}
