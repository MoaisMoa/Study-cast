package com.younghee.studycast.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "toss.payments")
public class TossPaymentsProperties {
    private String clientKey;
    private String secretKey;
    private String baseUrl = "https://api.tosspayments.com";
}
