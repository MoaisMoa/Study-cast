package com.younghee.studycast.oauth;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.RefreshTokenMapper;
import com.younghee.studycast.dto.RefreshTokenDTO;
import com.younghee.studycast.security.JwtProvider;
import com.younghee.studycast.util.AuthCookieUtil;
import com.younghee.studycast.util.TokenHashUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
// OAuth2 로그인 성공 후 실행되는 Handler
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler{

    private final JwtProvider jwtProvider;
    private final RefreshTokenMapper refreshTokenMapper;
    private final AuthCookieUtil authCookieUtil;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(
        HttpServletRequest request, 
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        // 1. CustomOAuth2UserService에서 반환한 principal 확인
        if (!(authentication.getPrincipal() instanceof StudycastOAuth2User oAuth2User)) {
            throw new IllegalStateException("OAuth 인증 사용자 정보를 확인할 수 없습니다.");
        }
        // 2. 회원 UUID 추출
        UUID userUuid = oAuth2User.getUserUuid();
        // 3. Access Token / Refresh Token 생성
        String accessToken = jwtProvider.createAccessToken(userUuid);
        String refreshToken = jwtProvider.createRefreshToken(userUuid);
        // 4. 기존 Refresh Token 전체 폐기
        refreshTokenMapper.revokeAllByUserUuid(userUuid);
        // 5. 새 Refresh Token 해시 저장
        saveRefreshToken(userUuid, refreshToken);
        // 6. 쿠키 Max-Age 계산
        int accessMaxAge = (int) (jwtProvider.getAccessTokenValidityMs() / 1000);
        int refreshMaxAge = (int) (jwtProvider.getRefreshTokenValidityMs() / 1000);
        // 7. httpOnly Cookie 생성
        ResponseCookie accessCookie = authCookieUtil.buildTokenCookie(
          AuthCookieUtil.ACCESS_TOKEN_COOKIE_NAME,
          accessToken,
          accessMaxAge  
        );
        ResponseCookie refreshCookie = authCookieUtil.buildTokenCookie(
          AuthCookieUtil.REFRESH_TOKEN_COOKIE_NAME,
          refreshToken,
          refreshMaxAge  
        );
        // 8. 응답 헤더에 Set-Cookie 추가
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        log.info("OAuth 로그인 성공 JWT 쿠키 발급 완료: userUuid={}", userUuid);
        // 9. 프론트 메인 페이지로 이동
        response.sendRedirect(frontendUrl);
    }

    // Refresh Token 원문은 DB 저장하지 않고, SHA-256 해시로 저장
    private void saveRefreshToken(UUID userUuid, String refreshToken) {
        RefreshTokenDTO token = new RefreshTokenDTO();

        token.setUserUuid(userUuid);
        token.setTokenHash(TokenHashUtil.sha256(refreshToken));
        token.setExpiryDate(
            LocalDateTime.now().plusSeconds(jwtProvider.getRefreshTokenValidityMs() / 1000)
        );
        token.setRevoked(false);

        refreshTokenMapper.insert(token);
    }

}
