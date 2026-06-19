package com.younghee.studycast.oauth;

import java.util.Map;

// OAuth provider별 사용자 정보 변환 객체를 생성하는 Factory 클래스
public class OAuthUserInfoFactory {
    
    private OAuthUserInfoFactory() {}
    // Spring Security의 registrationId의 값은 google, kakao로 들어옴.
    public static OAuthUserInfo of(String registrationId, Map<String, Object> attributes) {
        if (registrationId == null || registrationId.isBlank()) {
            throw new IllegalArgumentException("OAuth provider 정보가 없습니다.");
        }
        // google, kakao 기준으로 객체 생성
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleOAuthUserInfo(attributes);
            case "kakao" -> new KakaoOAuthUserInfo(attributes);
            default -> throw new IllegalArgumentException("지원하지 않는 OAuth provider입니다: " + registrationId);
        };
    }
}
