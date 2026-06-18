package com.younghee.studycast.oauth;

import java.util.Map;

// OAuth 제공자별 공통 메서드 인터페이스
public interface OAuthUserInfo {
    
    // OAuth 제공자 이름 반환 (GOOGLE, KAKAO)
    String getProvider();
    // OAuth 제공자가 제공하는 사용자 고유 ID 반환
    String getProviderUserId();
    // OAuth 제공자가 제공하는 이메일 반환
    String getEmail();
    // OAuth 제공자가 제공하는 이름 또는 닉네임 반환
    String getName();
    // OAuth 제공자가 제공하는 프로필 이미지 URL 반환
    String getProfileImage();
    // OAuth 제공자로부터 받은 원본 attributes 반환
    Map<String, Object> getAttributes();

}
