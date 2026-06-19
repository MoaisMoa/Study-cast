package com.younghee.studycast.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.younghee.studycast.config.TossPaymentsProperties;
import com.younghee.studycast.dto.response.TossBillingKeyResponse;
import com.younghee.studycast.dto.response.TossPaymentResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TossPaymentsServiceImpl implements TossPaymentsService {

    private final TossPaymentsProperties tossProperties;
    private final RestTemplate           restTemplate;

    @Override
    public TossBillingKeyResponse issueBillingKey(String authKey, String customerKey) {
        String url = tossProperties.getBaseUrl() + "/v1/billing/authorizations/" + authKey;

        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("customerKey", customerKey);

        try {
            ResponseEntity<TossBillingKeyResponse> res = restTemplate.postForEntity(
                url, new HttpEntity<>(body, headers), TossBillingKeyResponse.class
            );
            return res.getBody();
        } catch (RestClientException e) {
            log.error("토스 빌링키 발급 실패: authKey={}, error={}", authKey, e.getMessage());
            throw new IllegalStateException("결제 수단 등록에 실패했습니다.");
        }
    }

    @Override
    public TossPaymentResponse charge(String billingKey, String customerKey, int amount, String orderId, String orderName) {
        String url = tossProperties.getBaseUrl() + "/v1/billing/" + billingKey;

        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("customerKey", customerKey);
        body.put("amount",      amount);
        body.put("orderId",     orderId);
        body.put("orderName",   orderName);
        body.put("customerName", "구독자");

        try {
            ResponseEntity<TossPaymentResponse> res = restTemplate.postForEntity(
                url, new HttpEntity<>(body, headers), TossPaymentResponse.class
            );
            return res.getBody();
        } catch (RestClientException e) {
            log.error("토스 결제 실패: orderId={}, error={}", orderId, e.getMessage());
            throw new IllegalStateException("결제에 실패했습니다.");
        }
    }

    private HttpHeaders createAuthHeaders() {
        String credentials = tossProperties.getSecretKey() + ":";
        String encoded = Base64.getEncoder().encodeToString(
            credentials.getBytes(StandardCharsets.UTF_8)
        );
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);
        return headers;
    }
}
