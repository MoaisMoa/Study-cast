package com.younghee.studycast.oauth;

import java.util.Map;

// Google OAuth 사용자 정보 응답을 OAuthuserInfo 형식으로 변환하는 클래스
public class GoogleOAuthUserInfo implements OAuthUserInfo {
    
    // Google에서 전달받은 사용자 정보 원본
    private final Map<String, Object> attributes;

    public GoogleOAuthUserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
    // 우리 DB user_auths.provider에 저장할 provider 값
    @Override
    public String getProvider() {
        return "GOOGLE";
    }
    // Google의 사용자 고유 ID = sub
    @Override
    public String getProviderUserId() {
        Object sub = attributes.get("sub");
        return sub == null ? null : String.valueOf(sub);
    }
    // Google 계정 이메일
    @Override
    public String getEmail() {
        Object email = attributes.get("email");
        return email == null ? null : String.valueOf(email);
    }
    // Google 계정 이름
    @Override
    public String getName() {
        Object name = attributes.get("name");
        return name == null ? null : String.valueOf(name);
    }
    // Google 프로필 이미지 URL
    @Override
    public String getProfileImage() {
        Object picture = attributes.get("picture");
        return picture == null ? null : String.valueOf(picture);
    }
    // 원본 OAuth attributes 반환
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    
}
