package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.younghee.studycast.dao.EmailVerificationMapper;
import com.younghee.studycast.dao.RefreshTokenMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.EmailVerificationDTO;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.PasswordResetRequest;

/**
 * PasswordResetServiceImpl 단위 테스트
 *
 * ── 비밀번호 찾기 전체 흐름 ────────────────────────────────────────────────────
 *
 *  [1단계] sendCode(email)
 *      → 이메일 검증 → 가입 여부 확인 → 인증번호 생성·저장·발송
 *
 *  [2단계] verifyCode(email, code)
 *      → 이메일/코드 형식 검증 → DB에서 코드 조회 → BCrypt 비교
 *      → 성공 시 verified=true 처리
 *
 *  [3단계] resetPassword(request)
 *      → 입력값 검증 → 사용자 조회 → 코드 재확인 → 새 비밀번호 저장
 *      → Refresh Token 전체 폐기(로그인 상태 강제 해제)
 *
 * ── 테스트 전략 ─────────────────────────────────────────────────────────────
 * 각 단계별 정상 흐름 + 주요 실패 케이스(이메일 없음, 코드 만료, 인증 전 재설정 시도 등)를 검증한다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PasswordResetServiceImpl — 비밀번호 찾기 서비스 단위 테스트")
class PasswordResetServiceImplTest {

    @Mock private UserMapper                    userMapper;
    @Mock private EmailVerificationMapper       emailVerificationMapper;
    @Mock private PasswordEncoder               passwordEncoder;
    @Mock private EmailService                  emailService;
    @Mock private RefreshTokenMapper            refreshTokenMapper;
    @Mock private EmailVerificationAttemptService emailVerificationAttemptService;

    @InjectMocks
    private PasswordResetServiceImpl service;

    // ────────────────────────────────────────────────────────────────────────
    // 1. sendCode() — 인증번호 발송
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("sendCode — 정상: 인증번호 저장·발송 호출 확인")
    void sendCode_success() {
        // given
        String email = "user@test.com";
        UserDTO user = makeActiveUser(email);

        given(userMapper.findByEmail(email)).willReturn(user);
        // 최근 발송 이력 없음 (1분 제한에 걸리지 않음)
        given(emailVerificationMapper.findLatestByEmailAndPurpose(eq(email), anyString()))
                .willReturn(null);
        given(passwordEncoder.encode(anyString())).willReturn("$2a$encoded");

        // when
        service.sendCode(email);

        // then: 인증번호 DB 저장과 이메일 발송이 각 1번씩 호출됐어야 함
        verify(emailVerificationMapper).insert(any());
        verify(emailService).sendPasswordResetCode(eq(email), anyString());
    }

    @Test
    @DisplayName("sendCode — 실패: null 이메일은 IllegalArgumentException")
    void sendCode_nullEmail_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.sendCode(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일을 입력하세요");

        verify(userMapper, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("sendCode — 실패: 이메일 형식이 아니면 IllegalArgumentException")
    void sendCode_invalidEmailFormat_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.sendCode("notAnEmail"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일 형식");
    }

    @Test
    @DisplayName("sendCode — 실패: 가입되지 않은 이메일은 NoSuchElementException")
    void sendCode_emailNotFound_throwsNoSuchElement() {
        // given: DB에 해당 이메일 없음
        given(userMapper.findByEmail("notfound@test.com")).willReturn(null);

        assertThatThrownBy(() -> service.sendCode("notfound@test.com"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("가입된 이메일이 없습니다");
    }

    @Test
    @DisplayName("sendCode — 실패: 탈퇴 계정은 IllegalStateException")
    void sendCode_withdrawnAccount_throwsIllegalState() {
        // given: 탈퇴(WITHDRAWN) 상태 계정
        UserDTO user = makeActiveUser("w@test.com");
        user.setUserStatus("WITHDRAWN");
        given(userMapper.findByEmail("w@test.com")).willReturn(user);

        assertThatThrownBy(() -> service.sendCode("w@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("사용할 수 없는 계정");
    }

    @Test
    @DisplayName("sendCode — 실패: 1분 이내 재발송 시 IllegalStateException")
    void sendCode_tooSoon_throwsIllegalState() {
        // given: 30초 전에 이미 발송된 이력이 있음 (1분 제한에 걸림)
        String email = "user@test.com";
        given(userMapper.findByEmail(email)).willReturn(makeActiveUser(email));

        EmailVerificationDTO recentCode = new EmailVerificationDTO();
        recentCode.setCreatedAt(LocalDateTime.now().minusSeconds(30)); // 30초 전 발송
        given(emailVerificationMapper.findLatestByEmailAndPurpose(eq(email), anyString()))
                .willReturn(recentCode);

        assertThatThrownBy(() -> service.sendCode(email))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("1분 후 다시 요청");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. verifyCode() — 인증번호 확인
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyCode — 정상: 올바른 코드 입력 시 verified=true 처리")
    void verifyCode_success() {
        // given
        String email = "user@test.com";
        String rawCode = "123456";
        EmailVerificationDTO savedCode = makeValidCode();

        given(emailVerificationMapper.findLatestPasswordResetCode(email)).willReturn(savedCode);
        // BCrypt 비교 결과: 일치
        given(passwordEncoder.matches(rawCode, savedCode.getVerificationCode())).willReturn(true);

        // when
        service.verifyCode(email, rawCode);

        // then: verified=true 업데이트가 호출됐어야 함
        verify(emailVerificationMapper).markVerified(savedCode.getVerificationNo());
    }

    @Test
    @DisplayName("verifyCode — 실패: 인증번호가 6자리 숫자가 아니면 IllegalArgumentException")
    void verifyCode_invalidCodeFormat_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.verifyCode("user@test.com", "12345")) // 5자리
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("6자리 숫자");
    }

    @Test
    @DisplayName("verifyCode — 실패: DB에 인증번호가 없으면 NoSuchElementException")
    void verifyCode_noCodeFound_throwsNoSuchElement() {
        // given: DB 조회 결과 없음
        given(emailVerificationMapper.findLatestPasswordResetCode(anyString())).willReturn(null);

        assertThatThrownBy(() -> service.verifyCode("user@test.com", "123456"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("인증번호가 존재하지 않습니다");
    }

    @Test
    @DisplayName("verifyCode — 실패: 만료된 인증번호는 IllegalStateException")
    void verifyCode_expiredCode_throwsIllegalState() {
        // given: 만료 시각이 과거인 코드
        EmailVerificationDTO expiredCode = makeValidCode();
        expiredCode.setExpiryDate(LocalDateTime.now().minusMinutes(1)); // 이미 만료됨
        given(emailVerificationMapper.findLatestPasswordResetCode(anyString())).willReturn(expiredCode);

        assertThatThrownBy(() -> service.verifyCode("user@test.com", "123456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("만료");
    }

    @Test
    @DisplayName("verifyCode — 실패: 틀린 인증번호는 SecurityException + 실패 횟수 증가")
    void verifyCode_wrongCode_throwsSecurity_andIncrementsAttempt() {
        // given
        EmailVerificationDTO savedCode = makeValidCode();
        given(emailVerificationMapper.findLatestPasswordResetCode(anyString())).willReturn(savedCode);
        // BCrypt 비교 결과: 불일치
        given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

        // when & then
        assertThatThrownBy(() -> service.verifyCode("user@test.com", "999999"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("인증번호가 올바르지 않습니다");

        // 실패 횟수 증가 메서드가 호출됐는지 확인
        verify(emailVerificationAttemptService).increaseAttemptCount(savedCode.getVerificationNo());
        // 인증 실패이므로 markVerified 는 절대 호출되지 않아야 함
        verify(emailVerificationMapper, never()).markVerified(any());
    }

    @Test
    @DisplayName("verifyCode — 실패: 입력 횟수(3회) 초과 시 IllegalStateException")
    void verifyCode_maxAttemptsExceeded_throwsIllegalState() {
        // given: 이미 3번 틀린 상태
        EmailVerificationDTO savedCode = makeValidCode();
        savedCode.setAttemptCount(3); // MAX_ATTEMPT_COUNT = 3
        given(emailVerificationMapper.findLatestPasswordResetCode(anyString())).willReturn(savedCode);

        assertThatThrownBy(() -> service.verifyCode("user@test.com", "123456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("횟수를 초과");
    }

    @Test
    @DisplayName("verifyCode — 실패: 이미 사용된 인증번호는 IllegalStateException")
    void verifyCode_alreadyUsedCode_throwsIllegalState() {
        // given: used=true인 코드 (이미 비밀번호 변경에 사용됨)
        EmailVerificationDTO usedCode = makeValidCode();
        usedCode.setUsed(true);
        given(emailVerificationMapper.findLatestPasswordResetCode(anyString())).willReturn(usedCode);

        assertThatThrownBy(() -> service.verifyCode("user@test.com", "123456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 사용된");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. resetPassword() — 새 비밀번호 설정
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("resetPassword — 정상: 비밀번호 변경 + Refresh Token 전체 폐기")
    void resetPassword_success() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser("user@test.com");
        user.setUserUuid(uuid);
        user.setUserPassword("$2a$old");

        EmailVerificationDTO savedCode = makeValidCode();
        savedCode.setVerified(true); // 인증 완료된 코드

        PasswordResetRequest req = makeResetRequest("user@test.com", "123456", "newPass!1");

        given(userMapper.findByEmail("user@test.com")).willReturn(user);
        given(emailVerificationMapper.findLatestPasswordResetCode("user@test.com"))
                .willReturn(savedCode);
        given(passwordEncoder.matches("123456", savedCode.getVerificationCode())).willReturn(true);
        given(passwordEncoder.matches("newPass!1", "$2a$old")).willReturn(false); // 이전 비밀번호와 다름
        given(passwordEncoder.encode("newPass!1")).willReturn("$2a$new");
        given(userMapper.updatePassword(uuid, "$2a$new")).willReturn(1);

        // when
        service.resetPassword(req);

        // then: 비밀번호 변경 + Refresh Token 폐기 + 인증번호 used 처리 호출 확인
        verify(userMapper).updatePassword(uuid, "$2a$new");
        verify(refreshTokenMapper).revokeAllByUserUuid(uuid);
        verify(emailVerificationMapper).markUsed(savedCode.getVerificationNo());
    }

    @Test
    @DisplayName("resetPassword — 실패: 새 비밀번호 확인이 일치하지 않으면 IllegalArgumentException")
    void resetPassword_passwordMismatch_throwsIllegalArgument() {
        // given: 비밀번호와 확인 비밀번호가 다름
        PasswordResetRequest req = new PasswordResetRequest(
                "user@test.com", "123456", "newPass!1", "differentPass!1"
        );

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비밀번호가 일치하지 않습니다");
    }

    @Test
    @DisplayName("resetPassword — 실패: 형식 미달 새 비밀번호는 IllegalArgumentException")
    void resetPassword_weakPassword_throwsIllegalArgument() {
        // 영문·숫자·특수문자 포함 8~16자 조건 미달
        PasswordResetRequest req = new PasswordResetRequest(
                "user@test.com", "123456", "weak", "weak"
        );

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("8~16자리");
    }

    @Test
    @DisplayName("resetPassword — 실패: 이전 비밀번호와 동일하면 IllegalArgumentException")
    void resetPassword_sameAsOldPassword_throwsIllegalArgument() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser("user@test.com");
        user.setUserUuid(uuid);
        user.setUserPassword("$2a$same");

        EmailVerificationDTO savedCode = makeValidCode();
        savedCode.setVerified(true);

        PasswordResetRequest req = makeResetRequest("user@test.com", "123456", "samePass!1");

        given(userMapper.findByEmail("user@test.com")).willReturn(user);
        given(emailVerificationMapper.findLatestPasswordResetCode("user@test.com"))
                .willReturn(savedCode);
        given(passwordEncoder.matches("123456", savedCode.getVerificationCode())).willReturn(true);
        // 새 비밀번호가 기존 비밀번호와 동일한 상황
        given(passwordEncoder.matches("samePass!1", "$2a$same")).willReturn(true);

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이전 비밀번호와 동일");
    }

    @Test
    @DisplayName("resetPassword — 실패: verifyCode 단계를 거치지 않은 상태(verified=false)이면 IllegalStateException")
    void resetPassword_notVerified_throwsIllegalState() {
        // given: verified=false인 코드 (인증번호 확인 단계를 건너뜀)
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser("user@test.com");
        user.setUserUuid(uuid);

        EmailVerificationDTO unverifiedCode = makeValidCode();
        unverifiedCode.setVerified(false); // 인증 미완료

        PasswordResetRequest req = makeResetRequest("user@test.com", "123456", "newPass!1");

        given(userMapper.findByEmail("user@test.com")).willReturn(user);
        given(emailVerificationMapper.findLatestPasswordResetCode("user@test.com"))
                .willReturn(unverifiedCode);
        // 코드 자체는 맞지만 verified가 false인 상황
        given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("인증번호 확인이 필요");
    }

    @Test
    @DisplayName("resetPassword — 실패: 가입되지 않은 이메일은 NoSuchElementException")
    void resetPassword_userNotFound_throwsNoSuchElement() {
        // given: DB에 사용자 없음
        given(userMapper.findByEmail(anyString())).willReturn(null);

        PasswordResetRequest req = makeResetRequest("none@test.com", "123456", "newPass!1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("가입된 이메일이 없습니다");

        // DB 업데이트가 아예 일어나지 않아야 함
        verify(userMapper, never()).updatePassword(any(), anyString());
    }

    @Test
    @DisplayName("resetPassword — 실패: 탈퇴 계정은 IllegalStateException")
    void resetPassword_withdrawnUser_throwsIllegalState() {
        // given: 이메일은 가입돼 있지만 WITHDRAWN 상태
        UserDTO withdrawn = makeActiveUser("r@test.com");
        withdrawn.setUserStatus("WITHDRAWN");
        given(userMapper.findByEmail("r@test.com")).willReturn(withdrawn);

        PasswordResetRequest req = makeResetRequest("r@test.com", "123456", "newPass!1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("사용할 수 없는 계정");
    }

    @Test
    @DisplayName("resetPassword — 실패: 발송된 인증번호가 없으면 NoSuchElementException")
    void resetPassword_savedCodeNotFound_throwsNoSuchElement() {
        // given: 사용자는 ACTIVE이지만 인증번호 요청 이력 없음
        given(userMapper.findByEmail("r@test.com")).willReturn(makeActiveUser("r@test.com"));
        given(emailVerificationMapper.findLatestPasswordResetCode("r@test.com")).willReturn(null);

        PasswordResetRequest req = makeResetRequest("r@test.com", "123456", "newPass!1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("인증번호가 존재하지 않습니다");
    }

    @Test
    @DisplayName("resetPassword — 실패: 만료된 인증번호 → IllegalStateException")
    void resetPassword_expiredCode_throwsIllegalState() {
        // given: 사용자 ACTIVE, 코드는 만료
        given(userMapper.findByEmail("r@test.com")).willReturn(makeActiveUser("r@test.com"));

        EmailVerificationDTO expiredCode = makeValidCode();
        expiredCode.setExpiryDate(LocalDateTime.now().minusMinutes(1)); // 이미 만료
        given(emailVerificationMapper.findLatestPasswordResetCode("r@test.com")).willReturn(expiredCode);

        PasswordResetRequest req = makeResetRequest("r@test.com", "123456", "newPass!1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("만료");
    }

    @Test
    @DisplayName("resetPassword — 실패: 재설정 단계에서 시도 횟수(3회) 초과 → IllegalStateException")
    void resetPassword_maxAttemptsExceeded_throwsIllegalState() {
        // given: 사용자 ACTIVE, 코드는 verified=true이지만 attemptCount >= 3
        given(userMapper.findByEmail("r@test.com")).willReturn(makeActiveUser("r@test.com"));

        EmailVerificationDTO overAttemptCode = makeValidCode();
        overAttemptCode.setVerified(true);   // verifyCode 단계 통과
        overAttemptCode.setAttemptCount(3);  // MAX_ATTEMPT_COUNT 도달
        given(emailVerificationMapper.findLatestPasswordResetCode("r@test.com")).willReturn(overAttemptCode);

        PasswordResetRequest req = makeResetRequest("r@test.com", "123456", "newPass!1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("입력 횟수를 초과");
    }

    @Test
    @DisplayName("resetPassword — 실패: DB 비밀번호 업데이트 실패(0행 반환) → IllegalStateException")
    void resetPassword_updatePasswordFails_throwsIllegalState() {
        UserDTO user = makeActiveUser("r@test.com");
        given(userMapper.findByEmail("r@test.com")).willReturn(user);

        EmailVerificationDTO verifiedCode = makeValidCode();
        verifiedCode.setVerified(true);
        given(emailVerificationMapper.findLatestPasswordResetCode("r@test.com")).willReturn(verifiedCode);

        given(passwordEncoder.matches("123456", "$2a$hashed")).willReturn(true);   // 인증번호 일치
        given(passwordEncoder.matches("newPass!1", "$2a$encoded")).willReturn(false); // 이전 비밀번호와 다름
        given(passwordEncoder.encode("newPass!1")).willReturn("$2a$newEncoded");
        given(userMapper.updatePassword(any(UUID.class), anyString())).willReturn(0); // 업데이트 실패

        PasswordResetRequest req = makeResetRequest("r@test.com", "123456", "newPass!1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("비밀번호 변경에 실패");

        // DB 업데이트 실패 시 Refresh Token 폐기는 절대 호출되지 않아야 함
        verify(refreshTokenMapper, never()).revokeAllByUserUuid(any());
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    /** 활성 상태 사용자 UserDTO 생성 */
    private UserDTO makeActiveUser(String email) {
        UserDTO user = new UserDTO();
        user.setUserUuid(UUID.randomUUID());
        user.setUserEmail(email);
        user.setUserPassword("$2a$encoded");
        user.setUserStatus("ACTIVE");
        return user;
    }

    /** 유효한 상태(미사용, 미만료, 인증 전)의 EmailVerificationDTO 생성 */
    private EmailVerificationDTO makeValidCode() {
        EmailVerificationDTO code = new EmailVerificationDTO();
        code.setVerificationNo(1L);
        code.setVerificationCode("$2a$hashed");
        code.setVerified(false);
        code.setUsed(false);
        code.setAttemptCount(0);
        code.setExpiryDate(LocalDateTime.now().plusMinutes(5)); // 5분 후 만료
        code.setCreatedAt(LocalDateTime.now().minusMinutes(1)); // 1분 전 생성
        return code;
    }

    /**
     * 비밀번호 재설정 요청 DTO 생성.
     * 비밀번호 조건: 영문 + 숫자 + 특수문자 포함 8~16자
     */
    private PasswordResetRequest makeResetRequest(String email, String code, String newPw) {
        return new PasswordResetRequest(email, code, newPw, newPw);
    }
}
