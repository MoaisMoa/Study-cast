package com.younghee.studycast.service;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.RefreshTokenMapper;
import com.younghee.studycast.dao.UserAuthMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.UserAuthDTO;
import com.younghee.studycast.dto.response.AuthResponse;
import com.younghee.studycast.dto.RefreshTokenDTO;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.security.JwtProvider;
import com.younghee.studycast.util.TokenHashUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final UserAuthMapper userAuthMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final KakaoUnlinkService kakaoUnlinkService;

    @Override
    @Transactional
    public AuthResponse login(UserDTO request) {

        // 1. 입력값 검증
        validateLogin(request);
        log.info("로그인 요청: email={}", request.getUserEmail());
        // 2. 이메일로 사용자 조회
        UserDTO user = userMapper.findByEmail(request.getUserEmail());
        // 이메일/비밀번호 불일치는 사용자의 입력 오류이기도 하지만 인증 실패에 더 가까우므로 SecurityException
        if (user == null) {
            throw new SecurityException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        // 3. 사용자 상태 확인
        if (!"ACTIVE".equals(user.getUserStatus())) {
            throw new IllegalStateException("사용할 수 없는 계정입니다.");
        }
        // 추가) 소셜 전용 계정 일반 로그인 차단
        if (user.getUserPassword() == null || user.getUserPassword().isBlank()) {
            throw new SecurityException("소셜 로그인으로 가입한 계정입니다. 소셜 로그인을 이용해주세요.");
        }
        // 4. 비밀번호 비교
        if (!passwordEncoder.matches(request.getUserPassword(), user.getUserPassword())) {
            throw new SecurityException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        // 5. Access Token / Refresh Token 생성
        String accessToken = jwtProvider.createAccessToken(user.getUserUuid());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserUuid());
        // 추가. 기존 Refresh Token 전체 폐기
        refreshTokenMapper.revokeAllByUserUuid(user.getUserUuid());
        // 6. Refresh Token 해시 저장
        saveRefreshToken(user.getUserUuid(), refreshToken);
        log.info("로그인 성공: userUuid={}", user.getUserUuid());
        // 7. 토큰 응답
        return new AuthResponse(accessToken, refreshToken);
    }

    @Override
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        
        log.info("Access Token 재발급 요청");

        // 1. Refresh Token 존재 확인
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh Token이 없습니다.");
        }
        // 2. JWT 자체 검증
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new SecurityException("Refresh Token이 유효하지 않습니다.");
        }
        // 3. 토큰 타입
        if (!"REFRESH".equals(jwtProvider.getTokenType(refreshToken))) {
            throw new SecurityException("Refresh Token 형식이 아닙니다.");
        }
        // 4. Refresh Token 해시 조회
        String tokenHash = TokenHashUtil.sha256(refreshToken);
        RefreshTokenDTO savedToken = refreshTokenMapper.findByTokenHash(tokenHash);

        if (savedToken == null) {
            throw new NoSuchElementException("Refresh Token이 존재하지 않습니다.");
        }
        // 5. 폐기 여부 확인
        if (savedToken.isRevoked()) {
            throw new SecurityException("폐기된 Refresh Token입니다.");
        }
        // 6. DB 만료 시간 확인
        if (savedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new SecurityException("Refresh Token이 만료되었습니다.");
        }
        // 7. 토큰 안의 userUuid와 DB userUuid
        UUID userUuid = jwtProvider.getUserUuid(refreshToken);

        if (!savedToken.getUserUuid().equals(userUuid)) {
            throw new SecurityException("Refresh Token 사용자 정보가 일치하지 않습니다.");
        }
        // 8. 사용자 상태 확인 
        UserDTO user = userMapper.findByUuid(userUuid);
        
        if (user == null) {
            throw new NoSuchElementException("사용자를 찾을 수 없습니다.");
        }
        if (!"ACTIVE".equals(user.getUserStatus())) {
            throw new IllegalStateException("사용할 수 없는 계정입니다.");
        }
        // 9. 새 Access Token 발급
        String newAccessToken = jwtProvider.createAccessToken(userUuid);

        log.info("Access Token 재발급 성공: userUuid={}", userUuid);
        // Refresh Token 그대로 유지
        return new AuthResponse(newAccessToken, refreshToken);
    }

    @Override
    @Transactional
    public void logout(String refreshToken, UUID userUuid) {

        log.info("로그아웃 요청: userUuid={}", userUuid);

        // 1. Refresh Token 존재 확인
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("refresh Token이 없습니다.");
        }
        // 2. Refresh Token 해시 조회
        String tokenHash = TokenHashUtil.sha256(refreshToken);
        RefreshTokenDTO savedToken = refreshTokenMapper.findByTokenHash(tokenHash);

        if (savedToken == null) {
            throw new NoSuchElementException("Refresh Token이 존재하지 않습니다.");
        }
        // 3. 본인 토큰인지 확인
        if (!savedToken.getUserUuid().equals(userUuid)) {
            throw new SecurityException("본인의 Refresh Token만 로그아웃할 수 있습니다.");
        }
        // 4. Refresh Token 폐기
        int result = refreshTokenMapper.revokeByTokenHash(tokenHash);

        if (result != 1) {
            throw new IllegalStateException("로그아웃 처리에 실패했습니다.");
        }

        log.info("로그아웃 성공: userUuid={}", userUuid);
    }

    @Override
    public UserDTO getMe(UUID userUuid) {
        
        UserDTO user = userMapper.findByUuid(userUuid);

        if (user == null) {
            throw new NoSuchElementException("사용자를 찾을 수 없습니다.");
        }

        if (!"ACTIVE".equals(user.getUserStatus())) {
            throw new IllegalStateException("사용할 수 없는 계정입니다.");
        }

        // 비밀번호 등록 여부를 프론트에 알려준 뒤, 실제 비밀번호는 응답에 포함되면 안되므로 제거
        user.setHasPassword(user.getUserPassword() != null && !user.getUserPassword().isBlank());
        user.setUserPassword(null);

        // 관심 카테고리 — users 테이블에는 없어서 별도 조회 후 채워줌
        user.setCategories(userMapper.selectCategoryNamesByUserUuid(userUuid));

        return user;
    }

    private void saveRefreshToken(UUID userUuid, String refreshToken) {
        
        RefreshTokenDTO token = new RefreshTokenDTO();

        // 사용자 식별, 토큰, 만료일
        token.setUserUuid(userUuid);
        token.setTokenHash(TokenHashUtil.sha256(refreshToken));
        token.setExpiryDate(
            LocalDateTime.now().plusSeconds(jwtProvider.getRefreshTokenValidityMs() / 1000)
        );
        token.setRevoked(false);

        refreshTokenMapper.insert(token);
    }

    @Override
    @Transactional
    public void changePassword(UUID userUuid, String currentPassword, String newPassword) {
        UserDTO user = userMapper.findByUuid(userUuid);
        if (user == null || !"ACTIVE".equals(user.getUserStatus())) {
            throw new NoSuchElementException("사용자를 찾을 수 없습니다.");
        }
        if (user.getUserPassword() == null || user.getUserPassword().isBlank()) {
            throw new IllegalStateException("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        }
        if (!passwordEncoder.matches(currentPassword, user.getUserPassword())) {
            throw new SecurityException("현재 비밀번호가 일치하지 않습니다.");
        }
        userMapper.updatePassword(userUuid, passwordEncoder.encode(newPassword));
        log.info("비밀번호 변경 성공: userUuid={}", userUuid);
    }

    // 소셜 전용 계정에 비밀번호를 처음 등록 — 이미 로그인된 세션이 본인 확인 수단이라 현재 비밀번호 확인이 필요 없음
    @Override
    @Transactional
    public void registerPassword(UUID userUuid, String newPassword) {
        UserDTO user = userMapper.findByUuid(userUuid);
        if (user == null || !"ACTIVE".equals(user.getUserStatus())) {
            throw new NoSuchElementException("사용자를 찾을 수 없습니다.");
        }
        if (user.getUserPassword() != null && !user.getUserPassword().isBlank()) {
            throw new IllegalStateException("이미 비밀번호가 등록된 계정입니다.");
        }
        if (newPassword == null || !newPassword.matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()]).{8,16}$")) {
            throw new IllegalArgumentException("비밀번호는 영문자, 숫자, 특수문자를 포함한 8~16자리여야 합니다.");
        }
        userMapper.updatePassword(userUuid, passwordEncoder.encode(newPassword));
        log.info("비밀번호 등록 성공(소셜 계정에 연결): userUuid={}", userUuid);
    }

    @Override
    @Transactional
    public void withdraw(UUID userUuid, String password) {
        UserDTO user = userMapper.findByUuid(userUuid);
        if (user == null) {
            throw new NoSuchElementException("사용자를 찾을 수 없습니다.");
        }

        boolean isSocialOnly = user.getUserPassword() == null || user.getUserPassword().isBlank();

        // 소셜 전용 계정은 비밀번호가 없으므로, 이미 인증된 세션 자체를 본인 확인 수단으로 사용
        if (!isSocialOnly) {
            if (password == null || password.isBlank()) {
                throw new IllegalArgumentException("비밀번호를 입력해 주세요.");
            }
            if (!passwordEncoder.matches(password, user.getUserPassword())) {
                throw new SecurityException("현재 비밀번호가 일치하지 않습니다.");
            }
        }

        userMapper.updateUserStatus(userUuid, "WITHDRAWN");

        // 카카오 연동이 있으면 제공자 쪽 동의도 같이 해제 (best-effort, 실패해도 탈퇴는 완료된 상태로 유지)
        for (UserAuthDTO userAuth : userAuthMapper.findByUserUuid(userUuid)) {
            if ("KAKAO".equals(userAuth.getProvider())) {
                kakaoUnlinkService.unlink(userAuth.getProviderUserId());
            }
        }

        log.info("회원 탈퇴 처리 완료: userUuid={}", userUuid);
    }

    private void validateLogin(UserDTO request) {

        if (request == null) {
            throw new IllegalArgumentException("로그인 정보가 없습니다.");
        }

        if (request.getUserEmail() == null || request.getUserEmail().isBlank()) {
            throw new IllegalArgumentException("이메일을 입력하세요.");
        }

        if (request.getUserPassword() == null || request.getUserPassword().isBlank()) {
            throw new IllegalArgumentException("비밀번호를 입력하세요.");
        }
    }
    
}