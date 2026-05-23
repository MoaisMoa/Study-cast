package com.younghee.studycast.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.younghee.studycast.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // JWT 방식에서는 CSRF 비활성화
            .csrf(AbstractHttpConfigurer::disable)

            // 세션을 사용하지 않는 Stateless 인증 구조
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 기본 로그인 방식 비활성화
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)

            .authorizeHttpRequests(auth -> auth
                // 인증 없이 접근 허용
                .requestMatchers(
                    "/api/auth/signup",
                    "/api/auth/login",
                    "/api/auth/refresh",
                    "/ws/**"
                ).permitAll()

                // 인증 필요
                .requestMatchers(
                    "/api/auth/logout",
                    "/api/auth/me"
                ).authenticated()

                // 아직 다른 기능 개발 중이므로 임시 허용
                .anyRequest().permitAll()
            )

            // JWT 필터 등록
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}