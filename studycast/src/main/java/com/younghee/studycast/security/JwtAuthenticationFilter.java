package com.younghee.studycast.security;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.util.AuthCookieUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserMapper userMapper;
    private final AuthCookieUtil authCookieUtil;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();

        String token = authCookieUtil.extractCookieValue(request, AuthCookieUtil.ACCESS_TOKEN_COOKIE_NAME);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!jwtProvider.validateToken(token)) {
            sendUnauthorized(response, "유효하지 않은 토큰입니다.");
            return;
        }

        String type = jwtProvider.getTokenType(token);
        if (!"ACCESS".equals(type)) {
            sendUnauthorized(response, "액세스 토큰이 아닙니다.");
            return;
        }

        UUID userUuid = jwtProvider.getUserUuid(token);
        UserDTO user = userMapper.findByUuid(userUuid);

        if (user == null || !"ACTIVE".equals(user.getUserStatus())) {
            sendUnauthorized(response, "로그인이 필요합니다.");
            return;
        }

        SecurityContextHolder.clearContext();

        UsernamePasswordAuthenticationToken authenticationToken =
            new UsernamePasswordAuthenticationToken(
                userUuid,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );

        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
        log.debug("JWT 인증 성공: userUuid={}, uri={}", userUuid, uri);

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\": false, \"message\": \"" + message + "\"}");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        return uri.equals("/api/auth/signup")
                || uri.equals("/api/auth/login")
                || uri.equals("/api/auth/refresh")
                || uri.equals("/api/auth/password/send-code")
                || uri.equals("/api/auth/password/verify-code")
                || uri.equals("/api/auth/password/reset")
                || uri.startsWith("/oauth2/")
                || uri.startsWith("/login/oauth2/")
                || uri.startsWith("/room-images/")
                || uri.equals("/api/main/rooms")
                || uri.equals("/api/main/guest-recommendations")
                || uri.startsWith("/ws/");
    }
}