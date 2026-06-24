package com.younghee.studycast.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.EmailVerificationMapper;
import com.younghee.studycast.dao.RoleMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.EmailVerificationDTO;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.SignupRequest;
import com.younghee.studycast.exception.SocialAccountLinkRequiredException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService{

    private static final String PURPOSE_SIGNUP_LINK = "SIGNUP_LINK";
    private static final int CODE_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPT_COUNT = 3;
    private static final int RESEND_LIMIT_SECONDS = 60;
    private static final SecureRandom secureRandom = new SecureRandom();

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationMapper emailVerificationMapper;
    private final EmailService emailService;
    private final EmailVerificationAttemptService emailVerificationAttemptService;

    @Override
    @Transactional
    public int signup(SignupRequest request) {

        // 1. 입력값 검증
        validateSignup(request);

        log.info("***회원가입 요청: email={}", request.getUserEmail());
        // 2. 이메일 중복 확인
        UserDTO existingUser = userMapper.findByEmail(request.getUserEmail());

        if (existingUser != null) {
            boolean isSocialOnly = existingUser.getUserPassword() == null
                && "ACTIVE".equals(existingUser.getUserStatus());

            // 예외처리: 소셜 전용 계정이 아니면 이메일 중복은 DB 상태와 충돌
            if (!isSocialOnly) {
                throw new IllegalStateException("이미 사용 중인 이메일입니다.");
            }

            linkPasswordToSocialAccount(existingUser, request);

            log.info("소셜 계정에 비밀번호 연결 완료: userUuid={}, email={}",
                existingUser.getUserUuid(), existingUser.getUserEmail());

            return 1;
        }
        // 3. UserDTO 생성
        UserDTO user = new UserDTO();
        // 4. UUID 생성
        user.setUserUuid(UUID.randomUUID());
        // 5. 회원가입 요청값 세팅
        user.setUserEmail(request.getUserEmail());
        user.setUserName(request.getUserName());
        // 6. 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getUserPassword());
        user.setUserPassword(encodedPassword);
        // 7. 기본 상태 설정
        user.setUserStatus("ACTIVE");
        // 8. users 테이블 저장
        int result = userMapper.insertUser(user);
        // 9. roles 테이블에 기본 권한 저장
        roleMapper.insertDefaultRole(user.getUserUuid());

        log.info("회원가입 성공: userUuid={}, email={}", user.getUserUuid(), user.getUserEmail());

        return result;
    }

    // 소셜 전용 계정에 이메일 인증된 비밀번호를 연결
    private void linkPasswordToSocialAccount(UserDTO existingUser, SignupRequest request) {
        String code = request.getVerificationCode();

        if (code == null || code.isBlank()) {
            throw new SocialAccountLinkRequiredException(
                "이미 소셜 로그인으로 가입된 이메일입니다. 이메일 인증 후 비밀번호를 연결할 수 있습니다."
            );
        }

        EmailVerificationDTO savedCode =
            emailVerificationMapper.findLatestByEmailAndPurpose(request.getUserEmail(), PURPOSE_SIGNUP_LINK);

        validateSavedCode(savedCode);

        if (!savedCode.isVerified()) {
            throw new IllegalStateException("이메일 인증을 다시 진행해주세요.");
        }

        if (!passwordEncoder.matches(code, savedCode.getVerificationCode())) {
            emailVerificationAttemptService.increaseAttemptCount(savedCode.getVerificationNo());
            throw new SecurityException("인증번호가 올바르지 않습니다.");
        }

        String encodedPassword = passwordEncoder.encode(request.getUserPassword());
        userMapper.updatePassword(existingUser.getUserUuid(), encodedPassword);

        emailVerificationMapper.markUsed(savedCode.getVerificationNo());
    }

    // 소셜 전용 계정과 같은 이메일인 경우에만 인증번호 생성·발송 (1분 재발송 제한)
    @Override
    @Transactional
    public void sendLinkCode(String userEmail) {
        validateEmail(userEmail);

        UserDTO user = userMapper.findByEmail(userEmail);

        if (user == null || user.getUserPassword() != null) {
            throw new NoSuchElementException("연결 가능한 소셜 계정이 없습니다.");
        }

        if (!"ACTIVE".equals(user.getUserStatus())) {
            throw new IllegalStateException("사용할 수 없는 계정입니다.");
        }

        EmailVerificationDTO latestCode =
            emailVerificationMapper.findLatestByEmailAndPurpose(userEmail, PURPOSE_SIGNUP_LINK);

        if (latestCode != null &&
            latestCode.getCreatedAt().plusSeconds(RESEND_LIMIT_SECONDS).isAfter(LocalDateTime.now())
        ) {
            throw new IllegalStateException("인증번호는 1분 후 다시 요청할 수 있습니다.");
        }

        emailVerificationMapper.markUnusedCodesAsUsed(user.getUserUuid(), PURPOSE_SIGNUP_LINK);

        String rawCode = generateCode();
        String encodedCode = passwordEncoder.encode(rawCode);

        EmailVerificationDTO verification = new EmailVerificationDTO();
        verification.setUserUuid(user.getUserUuid());
        verification.setUserEmail(user.getUserEmail());
        verification.setVerificationCode(encodedCode);
        verification.setPurpose(PURPOSE_SIGNUP_LINK);
        verification.setVerified(false);
        verification.setUsed(false);
        verification.setAttemptCount(0);
        verification.setExpiryDate(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));

        emailVerificationMapper.insert(verification);

        emailService.sendSignupLinkCode(userEmail, rawCode);

        log.info("계정 연결 인증번호 발송 완료: email={}", userEmail);
    }

    // 인증번호 일치 여부만 확인 — 실제 비밀번호 연결은 signup() 재호출 시 처리
    @Override
    @Transactional
    public void verifyLinkCode(String userEmail, String verificationCode) {
        validateEmail(userEmail);
        validateVerificationCode(verificationCode);

        EmailVerificationDTO savedCode =
            emailVerificationMapper.findLatestByEmailAndPurpose(userEmail, PURPOSE_SIGNUP_LINK);

        validateSavedCode(savedCode);

        if (savedCode.getAttemptCount() >= MAX_ATTEMPT_COUNT) {
            throw new IllegalStateException("인증번호 입력 횟수를 초과했습니다.");
        }

        if (!passwordEncoder.matches(verificationCode, savedCode.getVerificationCode())) {
            emailVerificationAttemptService.increaseAttemptCount(savedCode.getVerificationNo());
            throw new SecurityException("인증번호가 올바르지 않습니다.");
        }

        emailVerificationMapper.markVerified(savedCode.getVerificationNo());

        log.info("계정 연결 인증번호 확인 성공: email={}", userEmail);
    }

    // 소셜 가입으로 자동 등록된 이름을 본인이 직접 고를 수 있도록 최초 1회만 변경 허용
    @Override
    @Transactional
    public void changeNameOnce(UUID userUuid, String newName) {
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("이름을 입력하세요.");
        }
        if (!newName.matches("^[가-힣]{2,5}$")) {
            throw new IllegalArgumentException("한글 2~5자 이내로 입력해주세요.");
        }

        int result = userMapper.updateNameOnce(userUuid, newName);

        if (result != 1) {
            throw new IllegalStateException("이미 이름을 변경했거나 변경할 수 없는 계정입니다.");
        }

        log.info("이름 변경 성공(최초 1회): userUuid={}", userUuid);
    }

    // 회원가입 폼에서 실시간 이메일 중복 확인 — signup()이 실제로 차단하는 경우(소셜 전용 계정은 연결 가능하므로 제외)와 동일한 기준
    @Override
    @Transactional(readOnly = true)
    public boolean isEmailTaken(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return false;
        }
        UserDTO existingUser = userMapper.findByEmail(userEmail);
        if (existingUser == null) {
            return false;
        }
        boolean isSocialOnly = existingUser.getUserPassword() == null
            && "ACTIVE".equals(existingUser.getUserStatus());
        return !isSocialOnly;
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

    private void validateVerificationCode(String verificationCode) {
        if (verificationCode == null || verificationCode.isBlank()) {
            throw new IllegalArgumentException("인증번호를 입력하세요.");
        }
        if (!verificationCode.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("인증번호는 6자리 숫자여야 합니다.");
        }
    }

    private void validateEmail(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new IllegalArgumentException("이메일을 입력하세요.");
        }
        if (!userEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다.");
        }
    }

    private String generateCode() {
        int number = secureRandom.nextInt(1_000_000);
        return String.format("%06d", number);
    }

    @Override
    @Transactional
    public void updateProfile(UUID userUuid, UserDTO dto) {
        if (userUuid == null) {
            throw new IllegalArgumentException("사용자 정보가 없습니다.");
        }
        dto.setUserUuid(userUuid);
        userMapper.updateProfile(dto);

        if (dto.getCategories() != null) {
            userMapper.deleteUserInterests(userUuid);
            for (String category : dto.getCategories()) {
                if (category != null && !category.isBlank()) {
                    userMapper.insertUserInterest(userUuid, category);
                }
            }
        }
    }

    private void validateSignup(SignupRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("회원 정보가 없습니다.");
        }
        if (request.getUserEmail() == null || request.getUserEmail().isBlank()) {
            throw new IllegalArgumentException("이메일을 입력하세요.");
        }
        if (!request.getUserEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다.");
        }
        if (request.getUserPassword() == null || request.getUserPassword().isBlank()) {
            throw new IllegalArgumentException("비밀번호를 입력하세요.");
        }
        if (!request.getUserPassword().matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()]).{8,16}$")) {
            throw new IllegalArgumentException("비밀번호는 영문자, 숫자, 특수문자를 포함한 8~16자리여야 합니다.");
        }
        if (request.getUserPasswordConfirm() == null || request.getUserPasswordConfirm().isBlank()) {
            throw new IllegalArgumentException("비밀번호 확인을 입력하세요.");
        }
        if (!request.getUserPassword().equals(request.getUserPasswordConfirm())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        if (request.getUserName() == null || request.getUserName().isBlank()) {
            throw new IllegalArgumentException("이름을 입력하세요.");
        }
        if (!request.getUserName().matches("^[가-힣]{2,5}$")) {
            throw new IllegalArgumentException("이름을 입력해주세요.");
        }
    }

}