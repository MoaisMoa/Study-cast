package com.younghee.studycast.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleRevokeServiceImpl implements GoogleRevokeService {

    private static final String REVOKE_URL = "https://oauth2.googleapis.com/revoke";

    private final RestTemplate restTemplate;

    @Override
    public void revoke(String refreshToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("token", refreshToken);

            restTemplate.postForEntity(REVOKE_URL, new HttpEntity<>(body, headers), String.class);

            log.info("구글 연동 해제 완료");
        } catch (Exception e) {
            // 연동 해제는 best-effort — 실패해도 탈퇴 자체는 막지 않음
            log.warn("구글 연동 해제 실패: reason={}", e.getMessage());
        }
    }
}
