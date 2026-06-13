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

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
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

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();

        String token = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("sc_access_token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

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
}
