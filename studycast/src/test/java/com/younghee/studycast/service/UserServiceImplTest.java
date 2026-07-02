package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import com.younghee.studycast.dao.RoleMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.EmailVerificationDTO;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.SignupRequest;
import com.younghee.studycast.exception.SocialAccountLinkRequiredException;

/**
 * UserServiceImpl 단위 테스트
 *
 * ── 주요 기능 ────────────────────────────────────────────────────────────────
 * signup()         : 회원가입 (신규 / 소셜 계정 비밀번호 연결)
 * isEmailTaken()   : 이메일 중복 확인 (소셜 전용 계정은 제외)
 * changeNameOnce() : 소셜 가입 계정 이름 최초 1회 변경
 * updateProfile()  : 성별/생년월일/각오 등 프로필 수정
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("UserServiceImpl — 회원 서비스 단위 테스트")
class UserServiceImplTest {

    @Mock private UserMapper                   userMapper;
    @Mock private RoleMapper                   roleMapper;
    @Mock private PasswordEncoder              passwordEncoder;
    @Mock private EmailVerificationMapper      emailVerificationMapper;
    @Mock private EmailService                 emailService;
    @Mock private EmailVerificationAttemptService emailVerificationAttemptService;

    @InjectMocks
    private UserServiceImpl userService;

    // ────────────────────────────────────────────────────────────────────────
    // 1. signup() — 회원가입
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("signup — 정상(신규): 사용자 저장 + 기본 권한 저장 호출")
    void signup_newUser_success() {
        // given: 새로 가입하려는 사용자 (기존 이메일 없음)
        SignupRequest req = makeSignupRequest("new@test.com", "홍길동", "Pass1234!");
        given(userMapper.findByEmail("new@test.com")).willReturn(null);
        given(passwordEncoder.encode("Pass1234!")).willReturn("$2a$encoded");
        given(userMapper.insertUser(any())).willReturn(1);

        // when
        int result = userService.signup(req);

        // then: 삽입 결과 1 반환 + 비밀번호 해시화 + 권한 저장도 호출됐어야 함
        assertThat(result).isEqualTo(1);
        verify(passwordEncoder).encode("Pass1234!");
        verify(userMapper).insertUser(any());
        verify(roleMapper).insertDefaultRole(any());
    }

    @Test
    @DisplayName("signup — 실패: 이미 사용 중인 이메일(일반 계정)은 IllegalStateException")
    void signup_duplicateEmail_throwsIllegalState() {
        // given: 이미 일반 가입된 이메일 (비밀번호 있음)
        UserDTO existing = makeActiveUser("dup@test.com", "$2a$pw");
        given(userMapper.findByEmail("dup@test.com")).willReturn(existing);

        SignupRequest req = makeSignupRequest("dup@test.com", "홍길동", "Pass1234!");

        assertThatThrownBy(() -> userService.signup(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 사용 중인 이메일");

        // DB 삽입은 일어나지 않아야 함
        verify(userMapper, never()).insertUser(any());
    }

    @Test
    @DisplayName("signup — 소셜 전용 계정 이메일로 가입 시도 + 인증코드 없으면 SocialAccountLinkRequiredException")
    void signup_socialAccountWithoutCode_throwsSocialLink() {
        // given: 비밀번호 없는 소셜 전용 계정이 이미 있는 상황
        UserDTO socialUser = makeActiveUser("social@test.com", null); // password=null
        given(userMapper.findByEmail("social@test.com")).willReturn(socialUser);

        // 인증코드 없이 가입 시도
        SignupRequest req = makeSignupRequest("social@test.com", "홍길동", "Pass1234!");
        req.setVerificationCode(null);

        assertThatThrownBy(() -> userService.signup(req))
                .isInstanceOf(SocialAccountLinkRequiredException.class)
                .hasMessageContaining("소셜 로그인으로 가입된 이메일");
    }

    @Test
    @DisplayName("signup — 실패: 이름이 null이면 IllegalArgumentException")
    void signup_nullName_throwsIllegalArgument() {
        SignupRequest req = makeSignupRequest("a@test.com", null, "Pass1234!");

        assertThatThrownBy(() -> userService.signup(req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("signup — 실패: 비밀번호 형식 미달 시 IllegalArgumentException")
    void signup_weakPassword_throwsIllegalArgument() {
        // 영문·숫자·특수문자 포함 8~16자 조건 미달 (숫자만)
        SignupRequest req = makeSignupRequest("a@test.com", "홍길동", "12345678");

        assertThatThrownBy(() -> userService.signup(req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. isEmailTaken() — 이메일 중복 여부 확인
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isEmailTaken — 미가입 이메일이면 false")
    void isEmailTaken_notRegistered_returnsFalse() {
        // given: DB에 해당 이메일 없음
        given(userMapper.findByEmail("free@test.com")).willReturn(null);

        assertThat(userService.isEmailTaken("free@test.com")).isFalse();
    }

    @Test
    @DisplayName("isEmailTaken — 일반 가입 이메일이면 true")
    void isEmailTaken_normalAccount_returnsTrue() {
        // given: 비밀번호가 있는 일반 계정
        given(userMapper.findByEmail("taken@test.com"))
                .willReturn(makeActiveUser("taken@test.com", "$2a$pw"));

        assertThat(userService.isEmailTaken("taken@test.com")).isTrue();
    }

    @Test
    @DisplayName("isEmailTaken — 소셜 전용 계정은 false (비밀번호 연결 가능하므로 중복이 아님)")
    void isEmailTaken_socialOnlyAccount_returnsFalse() {
        // given: 비밀번호 없는 소셜 전용 계정 — signup 시 비밀번호 연결이 가능하므로 "중복"이 아님
        UserDTO socialUser = makeActiveUser("social@test.com", null);
        given(userMapper.findByEmail("social@test.com")).willReturn(socialUser);

        assertThat(userService.isEmailTaken("social@test.com")).isFalse();
    }

    @Test
    @DisplayName("isEmailTaken — null이나 빈 이메일이면 false (조회 없이 바로 반환)")
    void isEmailTaken_nullOrEmpty_returnsFalse() {
        assertThat(userService.isEmailTaken(null)).isFalse();
        assertThat(userService.isEmailTaken("")).isFalse();
        assertThat(userService.isEmailTaken("   ")).isFalse();

        // DB 조회가 일어나지 않아야 함
        verify(userMapper, never()).findByEmail(anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. changeNameOnce() — 이름 최초 1회 변경 (소셜 계정 대상)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("changeNameOnce — 정상: 한글 2~5자 이름으로 변경 성공")
    void changeNameOnce_success() {
        // given: DB 업데이트 성공 (1행 처리)
        UUID uuid = UUID.randomUUID();
        given(userMapper.updateNameOnce(eq(uuid), eq("이순신"))).willReturn(1);

        // when: 예외 없이 완료되면 성공
        userService.changeNameOnce(uuid, "이순신");

        // then: 업데이트 메서드 호출 확인
        verify(userMapper).updateNameOnce(uuid, "이순신");
    }

    @Test
    @DisplayName("changeNameOnce — 실패: 이름이 null이면 IllegalArgumentException")
    void changeNameOnce_nullName_throwsIllegalArgument() {
        assertThatThrownBy(() -> userService.changeNameOnce(UUID.randomUUID(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이름을 입력하세요");
    }

    @Test
    @DisplayName("changeNameOnce — 실패: 한글이 아니거나 2자 미만이면 IllegalArgumentException")
    void changeNameOnce_invalidName_throwsIllegalArgument() {
        // 영문 이름
        assertThatThrownBy(() -> userService.changeNameOnce(UUID.randomUUID(), "Hong"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("한글 2~5자");

        // 1자 (최소 2자 필요)
        assertThatThrownBy(() -> userService.changeNameOnce(UUID.randomUUID(), "홍"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("changeNameOnce — 실패: 이미 변경했거나 변경 불가 계정이면 IllegalStateException")
    void changeNameOnce_alreadyChanged_throwsIllegalState() {
        // given: DB 업데이트가 0행 처리됨 (이미 변경된 계정)
        UUID uuid = UUID.randomUUID();
        given(userMapper.updateNameOnce(eq(uuid), eq("김철수"))).willReturn(0);

        assertThatThrownBy(() -> userService.changeNameOnce(uuid, "김철수"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 이름을 변경");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. updateProfile() — 프로필 수정
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile — 정상: 프로필 업데이트 호출 확인")
    void updateProfile_success() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO dto = new UserDTO();
        dto.setUserGender("남자");
        dto.setUserMotto("열심히 공부하자");

        // when
        userService.updateProfile(uuid, dto);

        // then: 업데이트 메서드가 uuid와 함께 호출됐는지 확인
        verify(userMapper).updateProfile(any());
    }

    @Test
    @DisplayName("updateProfile — 실패: null UUID이면 IllegalArgumentException")
    void updateProfile_nullUuid_throwsIllegalArgument() {
        assertThatThrownBy(() -> userService.updateProfile(null, new UserDTO()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. sendLinkCode() — 소셜 계정 비밀번호 연결용 인증번호 발송
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("sendLinkCode — 실패: null 이메일 → IllegalArgumentException")
    void sendLinkCode_nullEmail_throwsIllegalArgument() {
        assertThatThrownBy(() -> userService.sendLinkCode(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일");
    }

    @Test
    @DisplayName("sendLinkCode — 실패: 이메일 형식 오류 → IllegalArgumentException")
    void sendLinkCode_invalidEmailFormat_throwsIllegalArgument() {
        assertThatThrownBy(() -> userService.sendLinkCode("not-an-email"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일 형식");
    }

    @Test
    @DisplayName("sendLinkCode — 실패: 해당 이메일 사용자 없음 → NoSuchElementException")
    void sendLinkCode_userNotFound_throwsNoSuchElement() {
        given(userMapper.findByEmail("ghost@test.com")).willReturn(null);

        assertThatThrownBy(() -> userService.sendLinkCode("ghost@test.com"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("연결 가능한 소셜 계정이 없습니다");
    }

    @Test
    @DisplayName("sendLinkCode — 실패: 비밀번호 있는 일반 계정 → NoSuchElementException")
    void sendLinkCode_normalAccount_throwsNoSuchElement() {
        // 비밀번호가 있는 일반 계정은 소셜 계정이 아니므로 연결 불가
        UserDTO normalUser = makeActiveUser("normal@test.com", "$2a$pw");
        given(userMapper.findByEmail("normal@test.com")).willReturn(normalUser);

        assertThatThrownBy(() -> userService.sendLinkCode("normal@test.com"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("연결 가능한 소셜 계정이 없습니다");
    }

    @Test
    @DisplayName("sendLinkCode — 실패: 소셜 계정이지만 비활성 상태 → IllegalStateException")
    void sendLinkCode_inactiveUser_throwsIllegalState() {
        UserDTO inactiveUser = makeActiveUser("social@test.com", null);
        inactiveUser.setUserStatus("WITHDRAWN");
        given(userMapper.findByEmail("social@test.com")).willReturn(inactiveUser);

        assertThatThrownBy(() -> userService.sendLinkCode("social@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("사용할 수 없는 계정");
    }

    @Test
    @DisplayName("sendLinkCode — 실패: 1분 이내 재요청 → IllegalStateException")
    void sendLinkCode_rateLimitExceeded_throwsIllegalState() {
        // 소셜 계정이 활성 상태이고, 30초 전에 이미 인증번호를 요청한 상황
        UserDTO socialUser = makeActiveUser("social@test.com", null);
        given(userMapper.findByEmail("social@test.com")).willReturn(socialUser);

        EmailVerificationDTO recent = new EmailVerificationDTO();
        recent.setCreatedAt(LocalDateTime.now().minusSeconds(30));
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(recent);

        assertThatThrownBy(() -> userService.sendLinkCode("social@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("1분 후 다시 요청");
    }

    @Test
    @DisplayName("sendLinkCode — 정상: 기존 코드 무효화 + 새 코드 저장 + 이메일 발송 호출")
    void sendLinkCode_success_callsAllDependencies() {
        UserDTO socialUser = makeActiveUser("social@test.com", null);
        given(userMapper.findByEmail("social@test.com")).willReturn(socialUser);

        // 마지막 코드가 2분 전에 생성 → 제한 시간(1분) 초과로 재발송 가능
        EmailVerificationDTO old = new EmailVerificationDTO();
        old.setCreatedAt(LocalDateTime.now().minusSeconds(120));
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(old);

        given(passwordEncoder.encode(anyString())).willReturn("$2a$encoded");

        // when
        userService.sendLinkCode("social@test.com");

        // then: 기존 코드 무효화, 새 코드 저장, 이메일 발송이 모두 호출됐어야 함
        verify(emailVerificationMapper).markUnusedCodesAsUsed(eq(socialUser.getUserUuid()), eq("SIGNUP_LINK"));
        verify(emailVerificationMapper).insert(any());
        verify(emailService).sendSignupLinkCode(eq("social@test.com"), anyString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. verifyLinkCode() — 소셜 계정 연결 인증번호 검증
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyLinkCode — 실패: null 이메일 → IllegalArgumentException")
    void verifyLinkCode_nullEmail_throwsIllegalArgument() {
        assertThatThrownBy(() -> userService.verifyLinkCode(null, "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일");
    }

    @Test
    @DisplayName("verifyLinkCode — 실패: 6자리 숫자 형식이 아닌 코드 → IllegalArgumentException")
    void verifyLinkCode_invalidCodeFormat_throwsIllegalArgument() {
        // 숫자가 아닌 경우
        assertThatThrownBy(() -> userService.verifyLinkCode("social@test.com", "abcdef"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("6자리 숫자");

        // 5자리 (최소 6자리 필요)
        assertThatThrownBy(() -> userService.verifyLinkCode("social@test.com", "12345"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("verifyLinkCode — 실패: 저장된 코드 없음 → NoSuchElementException")
    void verifyLinkCode_savedCodeNotFound_throwsNoSuchElement() {
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(null);

        assertThatThrownBy(() -> userService.verifyLinkCode("social@test.com", "123456"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("인증번호가 존재하지 않습니다");
    }

    @Test
    @DisplayName("verifyLinkCode — 실패: 이미 사용된 코드 → IllegalStateException")
    void verifyLinkCode_usedCode_throwsIllegalState() {
        // used=true 인 코드 → validateSavedCode 에서 IllegalStateException
        EmailVerificationDTO usedCode = makeLinkVerificationCode(false, true, false, 0);
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(usedCode);

        assertThatThrownBy(() -> userService.verifyLinkCode("social@test.com", "123456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 사용된 인증번호");
    }

    @Test
    @DisplayName("verifyLinkCode — 실패: 만료된 코드 → IllegalStateException")
    void verifyLinkCode_expiredCode_throwsIllegalState() {
        EmailVerificationDTO expiredCode = makeLinkVerificationCode(false, false, true, 0);
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(expiredCode);

        assertThatThrownBy(() -> userService.verifyLinkCode("social@test.com", "123456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("만료");
    }

    @Test
    @DisplayName("verifyLinkCode — 실패: 시도 횟수 3회 초과 → IllegalStateException")
    void verifyLinkCode_maxAttemptsExceeded_throwsIllegalState() {
        // attemptCount = 3 → MAX_ATTEMPT_COUNT 도달로 차단
        EmailVerificationDTO maxAttemptCode = makeLinkVerificationCode(false, false, false, 3);
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(maxAttemptCode);

        assertThatThrownBy(() -> userService.verifyLinkCode("social@test.com", "123456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("입력 횟수를 초과");
    }

    @Test
    @DisplayName("verifyLinkCode — 실패: 코드 불일치 → SecurityException + 시도 횟수 증가 호출")
    void verifyLinkCode_codeMismatch_throwsSecurityAndIncrementAttempt() {
        EmailVerificationDTO validCode = makeLinkVerificationCode(false, false, false, 0);
        validCode.setVerificationNo(99L);
        validCode.setVerificationCode("$2a$hashed");
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(validCode);
        // matches() 가 false → 코드 불일치
        given(passwordEncoder.matches(anyString(), any())).willReturn(false);

        assertThatThrownBy(() -> userService.verifyLinkCode("social@test.com", "999999"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("인증번호가 올바르지 않습니다");

        // 시도 횟수 증가 메서드가 호출됐어야 함
        verify(emailVerificationAttemptService).increaseAttemptCount(99L);
    }

    @Test
    @DisplayName("verifyLinkCode — 정상: 코드 일치 → markVerified 호출")
    void verifyLinkCode_success_callsMarkVerified() {
        EmailVerificationDTO validCode = makeLinkVerificationCode(false, false, false, 0);
        validCode.setVerificationNo(77L);
        validCode.setVerificationCode("$2a$hashed");
        given(emailVerificationMapper.findLatestByEmailAndPurpose("social@test.com", "SIGNUP_LINK"))
                .willReturn(validCode);
        given(passwordEncoder.matches(anyString(), any())).willReturn(true);

        userService.verifyLinkCode("social@test.com", "123456");

        verify(emailVerificationMapper).markVerified(77L);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    /** 활성 상태 UserDTO 생성 */
    private UserDTO makeActiveUser(String email, String encodedPw) {
        UserDTO user = new UserDTO();
        user.setUserUuid(UUID.randomUUID());
        user.setUserEmail(email);
        user.setUserPassword(encodedPw);
        user.setUserStatus("ACTIVE");
        return user;
    }

    /** 회원가입 요청 SignupRequest 생성 */
    private SignupRequest makeSignupRequest(String email, String name, String password) {
        SignupRequest req = new SignupRequest();
        req.setUserEmail(email);
        req.setUserName(name);
        req.setUserPassword(password);
        req.setUserPasswordConfirm(password);
        return req;
    }

    /**
     * 계정 연결 인증번호 EmailVerificationDTO 생성 헬퍼
     *
     * @param verified 인증 완료 여부
     * @param used     이미 사용 처리 여부
     * @param expired  만료 여부 (true → 1분 전 만료, false → 10분 후 만료)
     * @param attempts 현재 시도 횟수
     */
    private EmailVerificationDTO makeLinkVerificationCode(
            boolean verified, boolean used, boolean expired, int attempts) {
        EmailVerificationDTO dto = new EmailVerificationDTO();
        dto.setVerified(verified);
        dto.setUsed(used);
        dto.setAttemptCount(attempts);
        dto.setExpiryDate(expired
                ? LocalDateTime.now().minusMinutes(1)   // 1분 전 만료
                : LocalDateTime.now().plusMinutes(10)); // 10분 후 만료
        dto.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        return dto;
    }
}
