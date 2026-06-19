package com.younghee.studycast.oauth;

import java.util.Collections;
import java.util.Map;

// Kakao OAuth 사용자 정보 응답을 OAuthUserInfo 형식으로 변환하는 클래스
public class KakaoOAuthUserInfo implements OAuthUserInfo {
    // Kakao에서 전달받은 사용자 정보 원본
    private final Map<String, Object> attributes;

    public KakaoOAuthUserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
    // 우리 DB user_auths.provider에 저장할 provider 값
    @Override
    public String getProvider() {
        return "KAKAO";
    }
    // Kakao의 사용자 고유 ID = 최상위 id 필드
    @Override
    public String getProviderUserId() {
        Object id = attributes.get("id");
        return id == null ? null : String.valueOf(id);
    }
    // Kakao 이메일 = kakao_account.email
    @Override
    public String getEmail() {
        Map<String, Object> kakaoAccount = getKakaoAccount();
        Object email = kakaoAccount.get("email");
        return email == null ? null : String.valueOf(email);
    }
    // Kakao 닉네임 = kakao_account.profile.nickname
    @Override
    public String getName() {
        Map<String, Object> profile = getProfile();
        Object nickname = profile.get("nickname");
        return nickname == null ? null : String.valueOf(nickname);
    }
    // Kakao 프로필 이미지 = kakao_account.profile.profile_image_url
    @Override
    public String getProfileImage() {
        Map<String, Object> profile = getProfile();
        Object profileImage = profile.get("profile_image_url");
        return profileImage == null ? null : String.valueOf(profileImage);
    }
    // 원본 OAuth attributes 반환
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
    // Kakao 응답에서 kakao_account 영역을 안전하게 꺼냄
    @SuppressWarnings("unchecked")
    private Map<String, Object> getKakaoAccount() {
        Object kakaoAccount = attributes.get("kakao_account");
        
        if (kakaoAccount instanceof Map<?, ?>) {
            return (Map<String, Object>) kakaoAccount;
        }
        // attributes.get("kakao_account")가 Map이 아니거나 없으면
        // NullPointerException 피하기 위해 빈 Map 반환
        return Collections.emptyMap();
    }
    // Kakao 응답에서 profile 영역 안전하게 꺼냄
    @SuppressWarnings("unchecked")
    private Map<String, Object> getProfile() {
        // profile 안에 nickname, profile_image_url 있음.
        Map<String, Object> kakaoAccount = getKakaoAccount();
        Object profile = kakaoAccount.get("profile");

        if (profile instanceof Map<?, ?>) {
            return (Map<String, Object>) profile;
        }

        return Collections.emptyMap();
    }

    
}
