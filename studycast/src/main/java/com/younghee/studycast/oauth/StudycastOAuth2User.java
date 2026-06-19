package com.younghee.studycast.oauth;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
// OAuth2 로그인 성공 후 Spring Security에 저장될 클래스
public class StudycastOAuth2User implements OAuth2User{
    
    // 우리 서비스 users 테이블의 회원 UUID
    private final UUID userUuid;
    // 회원 이메일
    private final String userEmail;
    // 회원 이름
    private final String userName;
    // 권한 목록
    private final Collection<? extends GrantedAuthority> authorities;
    // OAuth 제공자로부터 받은 원본 사용자 정보
    private final Map<String, Object> attributes;

    // OAuth 제공자로부터 받은 원본 attributes 반환
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
    // Spring Security 권한 반환
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
    // OAuth2User의 이름 식별자
    @Override
    public String getName() {
        // Spring 내부 식별용으로 사용
        // -> userUuid를 문자열으로 반환
        return String.valueOf(userUuid);
    }
}
