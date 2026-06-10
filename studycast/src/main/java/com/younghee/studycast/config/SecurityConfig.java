package com.younghee.studycast.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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
            // CORS 설정 적용
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

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
                    "/ws",
                    "/ws/**"
                ).permitAll()

                // 인증 필요
                .requestMatchers(
                    "/api/auth/logout",
                    "/api/auth/me",
                    "/api/auth/change-password",
                    "/api/auth/withdraw",
                    "/api/rooms/**"
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