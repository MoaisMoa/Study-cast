package com.younghee.studycast.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.younghee.studycast.oauth.CustomOAuth2UserService;
import com.younghee.studycast.oauth.OAuth2FailureHandler;
import com.younghee.studycast.oauth.OAuth2SuccessHandler;
import com.younghee.studycast.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    // 추가) 소셜 로그인
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final OAuthRedirectCaptureFilter oAuthRedirectCaptureFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS 설정 적용
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // JWT 방식에서는 CSRF 비활성화
            .csrf(AbstractHttpConfigurer::disable)

            // 세션을 사용하지 않는 Stateless 인증 구조
            // 수정) 소셜로그인 요청 과정에서만 세션 필요!
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )

            // 기본 로그인 방식 비활성화
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)

            // oauth2Login 설정 추가
            // OAuth 로그인 성공 후 사용자 정보 조회
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
            )

            // 인증/인가 실패 응답 처리
            .exceptionHandling(exception -> exception
                // 인증되지 않은 사용자가 인증 필요 API에 접근한 경우
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"success\":false,\"message\":\"로그인이 필요합니다.\"}");
                })
                // 인증O/권한X 경우
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"success\":false,\"message\":\"접근 권한이 없습니다.\"}");
                })
            )    
            
            .authorizeHttpRequests(auth -> auth
                // CORS preflight 요청 허용
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // 인증 없이 접근 허용
                .requestMatchers(
                    "/api/auth/signup",
                    "/api/auth/login",
                    "/api/auth/refresh",
                    "/api/auth/password/send-code",
                    "/api/auth/password/verify-code",
                    "/api/auth/password/reset",
                    "/room-images/**",
                    "/api/main/rooms",
                    "/api/main/guest-recommendations",
                    "/ws/**",
                    "/oauth2/**",
                    "/login/oauth2/**"
                ).permitAll()

                // 인증 필요
                .requestMatchers(
                    "/api/auth/logout",
                    "/api/auth/me",
                    "/api/rooms/**",
                    "/api/main/**",
                    "/api/visited-rooms/**",
                    "/api/payments/**"
                ).authenticated()

                // 아직 다른 기능 개발 중이므로 임시 허용
                .anyRequest().permitAll()
            )

            // JWT 필터 등록
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            )
            // 소셜 로그인 시작 시 redirect 파라미터를 세션에 저장 (OAuth2 인가 요청 전에 실행)
            .addFilterBefore(
                oAuthRedirectCaptureFilter,
                OAuth2AuthorizationRequestRedirectFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}