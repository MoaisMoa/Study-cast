package com.younghee.studycast.service;

import org.springframework.beans.factory.annotation.Value;
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
public class KakaoUnlinkServiceImpl implements KakaoUnlinkService {

    private static final String UNLINK_URL = "https://kapi.kakao.com/v1/user/unlink";

    private final RestTemplate restTemplate;

    @Value("${kakao.admin-key}")
    private String adminKey;

    @Override
    public void unlink(String providerUserId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", "KakaoAK " + adminKey);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("target_id_type", "user_id");
            body.add("target_id", providerUserId);

            restTemplate.postForEntity(UNLINK_URL, new HttpEntity<>(body, headers), String.class);

            log.info("카카오 연동 해제 완료: providerUserId={}", providerUserId);
        } catch (Exception e) {
            // 연동 해제는 best-effort — 실패해도 탈퇴 자체는 막지 않음
            log.warn("카카오 연동 해제 실패: providerUserId={}, reason={}", providerUserId, e.getMessage());
        }
    }
}
