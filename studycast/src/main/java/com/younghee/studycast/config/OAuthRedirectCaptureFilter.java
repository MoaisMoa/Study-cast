package com.younghee.studycast.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// 소셜 로그인 시작 시점의 redirect 파라미터를 세션에 저장 — OAuth2SuccessHandler에서 꺼내 씀
@Component
public class OAuthRedirectCaptureFilter extends OncePerRequestFilter {

    public static final String SESSION_KEY = "OAUTH_REDIRECT_TARGET";

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        if (request.getRequestURI().startsWith("/oauth2/authorization/")) {
            String redirect = request.getParameter("redirect");
            // 오픈 리다이렉트 방지 — "/"로 시작하는 내부 경로만 허용
            if (redirect != null && redirect.startsWith("/")) {
                request.getSession(true).setAttribute(SESSION_KEY, redirect);
            }
        }
        filterChain.doFilter(request, response);
    }
}
