package com.younghee.studycast.security;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.younghee.studycast.dao.RoleMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.UserDTO;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter{
    
    private final JwtProvider jwtProvider;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, 
        HttpServletResponse response, 
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        String uri = request.getRequestURI();
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        if (!jwtProvider.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String type = jwtProvider.getTokenType(token);
        if (!"ACCESS".equals(type)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        UUID userUuid = jwtProvider.getUserUuid(token);
        UserDTO user = userMapper.findByUuid(userUuid);

        if (user == null || !"ACTIVE".equals(user.getUserStatus())) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        SecurityContextHolder.clearContext();

        // ADMIN 추가 시
        // List<SimpleGrantedAuthority> authorities =
        //     roleMapper.findRolesByUserUuid(userUuid)
        //         .stream()
        //         .map(SimpleGrantedAuthority::new)
        //         .collect(Collectors.toList());

        UsernamePasswordAuthenticationToken authenticationToken =
            new UsernamePasswordAuthenticationToken(
                userUuid, 
                null, 
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
                // ADMIN 추가 시 위의 List 대신 아래 코드로 변경
                // authorities
            );
        
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);

        filterChain.doFilter(request, response);

        log.debug("JWT 인증 성공: userUuid={}, uri={}", userUuid, uri);
    }
}
