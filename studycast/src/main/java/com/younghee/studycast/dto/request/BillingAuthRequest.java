package com.younghee.studycast.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillingAuthRequest {
    private String authKey;
    private String customerKey;
    private String plan;        // ONE_MONTH | THREE_MONTHS | SIX_MONTHS
}
