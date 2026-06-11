package com.younghee.studycast.service;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.EmailVerificationMapper;
import com.younghee.studycast.dao.RefreshTokenMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.EmailVerificationDTO;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.PasswordResetRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {
    
    private static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";
    private static final int CODE_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPT_COUNT = 3;
    // 확장1) 인증번호 발송 제한 1분
    private static final int RESEND_LIMIT_SECONDS = 60;

    private final UserMapper userMapper;
    private final EmailVerificationMapper emailVerificationMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    // 확장3) 비밀번호 변경 후 기존 Refresh Token 폐기
    private final RefreshTokenMapper refreshTokenMapper;
    // 수정) 개별 트랜잭션
    private final EmailVerificationAttemptService emailVerificationAttemptService;

    @Override
    @Transactional
    public void sendCode(String userEmail) {
        // 1. 이메일 검증
        validateEmail(userEmail);
        // 2. 가입 회원 조회
        UserDTO user = userMapper.findByEmail(userEmail);

        if (user == null) {
            throw new NoSuchElementException("가입된 이메일이 없습니다.");
        }

        if (!"ACTIVE".equals(user.getUserStatus())) {
            throw new IllegalStateException("사용할 수 없는 계정입니다.");
        }
        // 확장1) 인증번호 재발송 제한 확인
        EmailVerificationDTO latestCode =
            emailVerificationMapper.findLatestByEmailAndPurpose(userEmail, PURPOSE_PASSWORD_RESET);
        
        if (latestCode != null &&
            latestCode.getCreatedAt().plusSeconds(RESEND_LIMIT_SECONDS).isAfter(LocalDateTime.now())
        ) {
            throw new IllegalStateException("인증번호는 1분 후 다시 요청할 수 있습니다.");
        }

        // 3. 기존 미사용 인증번호 재사용 불가 (used=true)
        emailVerificationMapper.markUnusedCodesAsUsed(
            user.getUserUuid(),
            PURPOSE_PASSWORD_RESET
        );

        // 4. 6자리 인증번호 생성
        String rawCode = generateCode();

        // 5. 인증번호 BCrypt로 암호화
        String encodedCode = passwordEncoder.encode(rawCode);

        EmailVerificationDTO verification = new EmailVerificationDTO();

        verification.setUserUuid(user.getUserUuid());
        verification.setUserEmail(user.getUserEmail());
        verification.setVerificationCode(encodedCode);
        verification.setPurpose(PURPOSE_PASSWORD_RESET);
        verification.setVerified(false);
        verification.setUsed(false);
        verification.setAttemptCount(0);
        verification.setExpiryDate(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));
        // 6. 인증번호 정보 저장
        emailVerificationMapper.insert(verification);

        // 7. 이메일로 인증번호 발송
        emailService.sendPasswordResetCode(userEmail, rawCode);

        log.info("비밀번호 재설정 인증번호 발송 완료: email={}", userEmail);
    }

    @Override
    @Transactional
    public void verifyCode(String userEmail, String verificationCode) {
        // 1. 이메일/인증번호 검증
        validateEmail(userEmail);
        validateVerificationCode(verificationCode);
        // 2. 최신 미사용 인증번호 조회
        EmailVerificationDTO savedCode = 
            emailVerificationMapper.findLatestPasswordResetCode(userEmail);
        // 3. 인증번호 존재 여부 / 사용 여부 / 만료 여부 확인
        validateSavedCode(savedCode);
        // 4. 실패 횟수 확인
        if (savedCode.getAttemptCount() >= MAX_ATTEMPT_COUNT) {
            throw new IllegalStateException("인증번호 입력 횟수를 초과했습니다.");
        }        
        // 5. BCrypt matches로 비교 (개별 트랜잭션)
        if (!passwordEncoder.matches(verificationCode, savedCode.getVerificationCode())) {
            emailVerificationAttemptService.increaseAttemptCount(savedCode.getVerificationNo());
            throw new SecurityException("인증번호가 올바르지 않습니다.");
        }
        // 6. 성공 시 verified=true 처리
        emailVerificationMapper.markVerified(savedCode.getVerificationNo());

        log.info("비밀번호 재설정 인증번호 확인 성공: email={}", userEmail);
    }

    @Override
    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        // 1. 이메일/인증번호/새 비밀번호 검증
        validateResetRequest(request);
        // 2. 사용자 조회
        UserDTO user = userMapper.findByEmail(request.getUserEmail());
        
        if (user == null) {
            throw new NoSuchElementException("가입된 이메일이 없습니다.");
        }
        
        if (!"ACTIVE".equals(user.getUserStatus())) {
            throw new IllegalStateException("사용할 수 없는 계정입니다.");
        }
        // 3. 해당 이메일의 최신 미사용 인증번호 조회
        EmailVerificationDTO savedCode =
            emailVerificationMapper.findLatestPasswordResetCode(request.getUserEmail());
        // 4. 인증번호 존재 여부 / 사용 여부 / 만료 여부 확인
        validateSavedCode(savedCode);
        // 5. 인증번호 확인 완료 여부 확인
        if (!savedCode.isVerified()) {
            throw new IllegalStateException("인증번호 확인이 필요합니다.");
        }

        if (savedCode.getAttemptCount() >= MAX_ATTEMPT_COUNT) {
            throw new IllegalStateException("인증번호 입력 횟수를 초과했습니다.");
        }

        // 6. reset 단계에서도 인증번호 재확인
        if (!passwordEncoder.matches(request.getVerificationCode(), savedCode.getVerificationCode())) {
            emailVerificationAttemptService.increaseAttemptCount(savedCode.getVerificationNo());
            throw new SecurityException("인증번호가 올바르지 않습니다.");
        }

        // 7. 기존 비밀번호와 동일 여부 확인
        if (passwordEncoder.matches(request.getNewPassword(), user.getUserPassword())) {
            throw new IllegalArgumentException("이전 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        }
        // 8. 새 비밀번호 BCrypt 암호화
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        // 9. users 비밀번호 변경
        // int result = userMapper.updatePassword(user.getUserUuid(), encodedPassword);

        // if (result != 1) {
        //     throw new IllegalStateException("비밀번호 변경에 실패했습니다.");
        // }
        // 확장2) 비밀번호 변경 후 기존 Refresh Token 전체 폐기
        refreshTokenMapper.revokeAllByUserUuid(user.getUserUuid());
        
        // 10. 비밀번호 변경에 사용된 인증번호 used=true 처리
        emailVerificationMapper.markUsed(savedCode.getVerificationNo());

        log.info("비밀번호 재설정 성공: userUuid={}, email={}", user.getUserUuid(), user.getUserEmail());   

    }

    // 유효성 검사
    private void validateEmail(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new IllegalArgumentException("이메일을 입력하세요.");
        }

        if (!userEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다.");
        }
    }

    private void validateVerificationCode(String verificationCode) {
        if (verificationCode == null || verificationCode.isBlank()) {
            throw new IllegalArgumentException("인증번호를 입력하세요.");
        }

        if (!verificationCode.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("인증번호는 6자리 숫자여야 합니다.");
        }
    }

    private void validateResetRequest(PasswordResetRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("비밀번호 변경 정보가 없습니다.");
        }

        validateEmail(request.getUserEmail());
        validateVerificationCode(request.getVerificationCode());

        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력하세요.");
        }

        if (!request.getNewPassword().matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()]).{8,16}$")) {
            throw new IllegalArgumentException("비밀번호는 영문자, 숫자, 특수문자를 포함한 8~16자리여야 합니다.");
        }

        if (request.getNewPasswordConfirm() == null || request.getNewPasswordConfirm().isBlank()) {
            throw new IllegalArgumentException("새 비밀번호 확인을 입력하세요.");
        }

        if (!request.getNewPassword().equals(request.getNewPasswordConfirm())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
    }

    private void validateSavedCode(EmailVerificationDTO savedCode) {
        if (savedCode == null) {
            throw new NoSuchElementException("인증번호가 존재하지 않습니다.");
        }

        if (savedCode.isUsed()) {
            throw new IllegalStateException("이미 사용된 인증번호입니다.");
        }

        if (savedCode.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("인증번호가 만료되었습니다.");
        }
    }

    private String generateCode() {
        Random random = new Random();
        int number = random.nextInt(1_000_000);

        return String.format("%06d", number);
    }
    
}