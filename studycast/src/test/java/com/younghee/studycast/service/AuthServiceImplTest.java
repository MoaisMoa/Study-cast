package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.younghee.studycast.dao.RefreshTokenMapper;
import com.younghee.studycast.dao.UserAuthMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.RefreshTokenDTO;
import com.younghee.studycast.dto.UserAuthDTO;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.response.AuthResponse;
import com.younghee.studycast.security.JwtProvider;
import com.younghee.studycast.util.CryptoUtil;

/**
 * AuthServiceImpl 단위 테스트
 *
 * ── Mockito 핵심 개념 ────────────────────────────────────────────────────────
 *
 * @ExtendWith(MockitoExtension.class)
 *   JUnit5에게 "이 테스트 클래스는 Mockito를 사용한다"고 선언.
 *   덕분에 @Mock, @InjectMocks 어노테이션이 자동으로 처리됨.
 *
 * @Mock
 *   실제 구현체 대신 "가짜 객체(Mock)"를 만들어 준다.
 *   예) @Mock UserMapper userMapper 라고 선언하면,
 *       실제 DB에 연결하지 않는 가짜 UserMapper 가 만들어진다.
 *       기본적으로 모든 메서드는 null / 0 / false 를 반환하므로,
 *       필요한 경우에만 given(...)으로 반환값을 지정한다.
 *
 * @InjectMocks
 *   @Mock으로 만든 가짜 객체들을 실제 테스트 대상(AuthServiceImpl)에 주입해 준다.
 *   즉, 실제 코드를 실행하면서 DB·JWT 등의 의존성은 가짜로 대체해서 검증.
 *
 * given(...).willReturn(...)
 *   특정 메서드가 호출됐을 때 반환할 값을 미리 지정.
 *   예) given(userMapper.findByEmail("a@b.com")).willReturn(fakeUser)
 *   → userMapper.findByEmail("a@b.com") 이 호출되면 fakeUser 를 돌려줘라.
 *
 * assertThatThrownBy(() -> 코드).isInstanceOf(예외클래스.class)
 *   해당 코드를 실행했을 때 지정한 예외가 발생하는지 검증.
 *   예외가 발생하지 않거나 다른 종류의 예외가 나오면 테스트 실패.
 *
 * verify(mock객체).메서드(...)
 *   해당 mock 객체의 메서드가 실제로 호출됐는지 검증.
 *   never()와 조합하면 "한 번도 호출되지 않았어야 한다"는 검증이 됨.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl — 인증 서비스 단위 테스트")
class AuthServiceImplTest {

    // ── Mock 객체 선언 ──────────────────────────────────────────────────────
    // 실제 DB / JWT / 암호화 등을 쓰지 않고 가짜로 대체
    @Mock private UserMapper         userMapper;
    @Mock private UserAuthMapper     userAuthMapper;
    @Mock private RefreshTokenMapper refreshTokenMapper;
    @Mock private PasswordEncoder    passwordEncoder;
    @Mock private JwtProvider        jwtProvider;
    @Mock private KakaoUnlinkService kakaoUnlinkService;
    @Mock private GoogleRevokeService googleRevokeService;
    @Mock private CryptoUtil         cryptoUtil;

    // ── 테스트 대상 ─────────────────────────────────────────────────────────
    // @Mock 들이 자동으로 주입된 실제 AuthServiceImpl 인스턴스
    @InjectMocks
    private AuthServiceImpl authService;

    // ────────────────────────────────────────────────────────────────────────
    // 1. login()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login — 정상: 이메일·비밀번호 일치 시 Access/Refresh Token 반환")
    void login_success() {
        // given: 로그인할 사용자 정보 준비
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "test@email.com", "$2a$encoded");

        UserDTO request = new UserDTO();
        request.setUserEmail("test@email.com");
        request.setUserPassword("password123!");

        // Mock 동작 지정:
        // "userMapper.findByEmail 이 호출되면 위의 가짜 user 를 반환해라"
        given(userMapper.findByEmail("test@email.com")).willReturn(user);
        // "passwordEncoder.matches 가 호출되면 true(비밀번호 일치)를 반환해라"
        given(passwordEncoder.matches("password123!", "$2a$encoded")).willReturn(true);
        // JWT 토큰 생성 결과를 가짜 문자열로 지정
        given(jwtProvider.createAccessToken(uuid)).willReturn("fake-access-token");
        given(jwtProvider.createRefreshToken(uuid)).willReturn("fake-refresh-token");

        // when: 실제 login() 호출
        AuthResponse response = authService.login(request);

        // then: 반환된 토큰이 기대한 값인지 검증
        assertThat(response.getAccessToken()).isEqualTo("fake-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("fake-refresh-token");

        // 로그아웃 처리(기존 토큰 폐기)와 새 토큰 저장이 각 1번씩 호출됐는지 확인
        verify(refreshTokenMapper).revokeAllByUserUuid(uuid);
        verify(refreshTokenMapper).insert(any());
    }

    @Test
    @DisplayName("login — 실패: 이메일이 null이면 IllegalArgumentException")
    void login_nullEmail_throwsIllegalArgument() {
        // given
        UserDTO request = new UserDTO();
        request.setUserEmail(null);
        request.setUserPassword("password");

        // when & then: 예외가 발생해야 하고, DB 조회는 한 번도 일어나지 않아야 함
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userMapper, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("login — 실패: 가입되지 않은 이메일이면 SecurityException")
    void login_emailNotFound_throwsSecurity() {
        // given: DB에 해당 이메일이 없는 상황 (null 반환)
        UserDTO request = makeLoginRequest("notfound@email.com", "pw");
        given(userMapper.findByEmail("notfound@email.com")).willReturn(null);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("이메일 또는 비밀번호");
    }

    @Test
    @DisplayName("login — 실패: 비밀번호 불일치 시 SecurityException")
    void login_wrongPassword_throwsSecurity() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "a@b.com", "$2a$encoded");
        UserDTO request = makeLoginRequest("a@b.com", "wrongPw");

        given(userMapper.findByEmail("a@b.com")).willReturn(user);
        // 비밀번호가 틀린 상황: false 반환
        given(passwordEncoder.matches("wrongPw", "$2a$encoded")).willReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("이메일 또는 비밀번호");
    }

    @Test
    @DisplayName("login — 실패: 소셜 전용 계정(비밀번호 없음)은 SecurityException")
    void login_socialOnlyAccount_throwsSecurity() {
        // given: 비밀번호 필드가 null인 소셜 전용 계정
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "social@b.com", null); // password=null
        UserDTO request = makeLoginRequest("social@b.com", "anyPw");

        given(userMapper.findByEmail("social@b.com")).willReturn(user);

        // when & then: "소셜 로그인으로 가입한 계정" 메시지와 함께 예외 발생
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("소셜 로그인");
    }

    @Test
    @DisplayName("login — 실패: WITHDRAWN(탈퇴) 상태 계정은 IllegalStateException")
    void login_withdrawnAccount_throwsIllegalState() {
        // given: 상태가 WITHDRAWN인 계정
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "w@b.com", "$2a$pw");
        user.setUserStatus("WITHDRAWN");

        UserDTO request = makeLoginRequest("w@b.com", "pw");
        given(userMapper.findByEmail("w@b.com")).willReturn(user);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("사용할 수 없는 계정");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. refresh()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("refresh — 정상: 유효한 Refresh Token으로 새 Access Token 발급")
    void refresh_success() {
        // given
        UUID uuid = UUID.randomUUID();
        String fakeRefreshToken = "valid.refresh.token";
        UserDTO user = makeActiveUser(uuid, "u@b.com", "$2a$pw");

        // Refresh Token이 유효하고, 타입이 REFRESH이며, DB에 존재하고, 폐기되지 않은 상태
        given(jwtProvider.validateToken(fakeRefreshToken)).willReturn(true);
        given(jwtProvider.getTokenType(fakeRefreshToken)).willReturn("REFRESH");
        given(refreshTokenMapper.findByTokenHash(anyString()))
                .willReturn(makeActiveRefreshToken(uuid));
        given(jwtProvider.getUserUuid(fakeRefreshToken)).willReturn(uuid);
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(jwtProvider.createAccessToken(uuid)).willReturn("new-access-token");

        // when
        AuthResponse response = authService.refresh(fakeRefreshToken);

        // then: 새 Access Token 발급 + 기존 Refresh Token 유지
        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        assertThat(response.getRefreshToken()).isEqualTo(fakeRefreshToken);
    }

    @Test
    @DisplayName("refresh — 실패: null 토큰이면 IllegalArgumentException")
    void refresh_nullToken_throwsIllegalArgument() {
        assertThatThrownBy(() -> authService.refresh(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("refresh — 실패: JWT 검증 실패 시 SecurityException")
    void refresh_invalidJwt_throwsSecurity() {
        // given: JWT 자체가 유효하지 않은 상황
        given(jwtProvider.validateToken("bad.token")).willReturn(false);

        assertThatThrownBy(() -> authService.refresh("bad.token"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("유효하지 않습니다");
    }

    @Test
    @DisplayName("refresh — 실패: Access Token을 Refresh 엔드포인트에 보내면 SecurityException")
    void refresh_accessTokenAsRefresh_throwsSecurity() {
        // given: JWT는 유효하지만 타입이 ACCESS (REFRESH여야 함)
        given(jwtProvider.validateToken("access.token")).willReturn(true);
        given(jwtProvider.getTokenType("access.token")).willReturn("ACCESS");

        assertThatThrownBy(() -> authService.refresh("access.token"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Refresh Token 형식");
    }

    @Test
    @DisplayName("refresh — 실패: 폐기된 토큰이면 SecurityException")
    void refresh_revokedToken_throwsSecurity() {
        // given: DB에 저장된 토큰의 revoked=true
        UUID uuid = UUID.randomUUID();
        given(jwtProvider.validateToken("revoked.token")).willReturn(true);
        given(jwtProvider.getTokenType("revoked.token")).willReturn("REFRESH");

        RefreshTokenDTO revokedToken = makeActiveRefreshToken(uuid);
        revokedToken.setRevoked(true); // 폐기 상태
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(revokedToken);

        assertThatThrownBy(() -> authService.refresh("revoked.token"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("폐기된");
    }

    @Test
    @DisplayName("refresh — 실패: DB에 저장된 Refresh Token이 없으면 NoSuchElementException")
    void refresh_tokenNotInDb_throwsNoSuchElement() {
        // JWT 검증은 통과하지만 DB에 해당 해시가 없는 상황 (예: 로그아웃 후 재사용 시도)
        given(jwtProvider.validateToken("stale.token")).willReturn(true);
        given(jwtProvider.getTokenType("stale.token")).willReturn("REFRESH");
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(null);

        assertThatThrownBy(() -> authService.refresh("stale.token"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("Refresh Token이 존재하지 않습니다");
    }

    @Test
    @DisplayName("refresh — 실패: DB 만료 시간이 지난 토큰이면 SecurityException")
    void refresh_expiredInDb_throwsSecurity() {
        // JWT 클레임의 exp는 아직 유효하지만 DB에 저장된 만료일이 지난 경우
        UUID uuid = UUID.randomUUID();
        given(jwtProvider.validateToken("exp.token")).willReturn(true);
        given(jwtProvider.getTokenType("exp.token")).willReturn("REFRESH");

        RefreshTokenDTO expiredToken = makeActiveRefreshToken(uuid);
        expiredToken.setExpiryDate(LocalDateTime.now().minusMinutes(1)); // DB 만료
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(expiredToken);

        assertThatThrownBy(() -> authService.refresh("exp.token"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("만료되었습니다");
    }

    @Test
    @DisplayName("refresh — 실패: 토큰 소유자(DB)와 JWT uuid가 다르면 SecurityException")
    void refresh_uuidMismatch_throwsSecurity() {
        UUID dbUuid  = UUID.randomUUID(); // DB에 저장된 소유자
        UUID jwtUuid = UUID.randomUUID(); // JWT 클레임의 uuid (다른 사람)

        given(jwtProvider.validateToken("mismatch.token")).willReturn(true);
        given(jwtProvider.getTokenType("mismatch.token")).willReturn("REFRESH");
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(makeActiveRefreshToken(dbUuid));
        given(jwtProvider.getUserUuid("mismatch.token")).willReturn(jwtUuid);

        assertThatThrownBy(() -> authService.refresh("mismatch.token"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("사용자 정보가 일치하지 않습니다");
    }

    @Test
    @DisplayName("refresh — 실패: 사용자가 DB에 없으면 NoSuchElementException")
    void refresh_userNotFound_throwsNoSuchElement() {
        UUID uuid = UUID.randomUUID();
        given(jwtProvider.validateToken("valid.token")).willReturn(true);
        given(jwtProvider.getTokenType("valid.token")).willReturn("REFRESH");
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(makeActiveRefreshToken(uuid));
        given(jwtProvider.getUserUuid("valid.token")).willReturn(uuid);
        given(userMapper.findByUuid(uuid)).willReturn(null); // 사용자 없음

        assertThatThrownBy(() -> authService.refresh("valid.token"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("사용자를 찾을 수 없습니다");
    }

    @Test
    @DisplayName("refresh — 실패: 사용자 계정이 비활성 상태이면 IllegalStateException")
    void refresh_inactiveUser_throwsIllegalState() {
        UUID uuid = UUID.randomUUID();
        given(jwtProvider.validateToken("valid.token")).willReturn(true);
        given(jwtProvider.getTokenType("valid.token")).willReturn("REFRESH");
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(makeActiveRefreshToken(uuid));
        given(jwtProvider.getUserUuid("valid.token")).willReturn(uuid);

        UserDTO withdrawn = makeActiveUser(uuid, "u@test.com", "$2a$pw");
        withdrawn.setUserStatus("WITHDRAWN");
        given(userMapper.findByUuid(uuid)).willReturn(withdrawn);

        assertThatThrownBy(() -> authService.refresh("valid.token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("사용할 수 없는 계정");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. logout()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("logout — 정상: 유효한 토큰이면 폐기 처리 성공")
    void logout_success() {
        // given
        UUID uuid = UUID.randomUUID();
        String refreshToken = "valid.refresh.token";
        RefreshTokenDTO storedToken = makeActiveRefreshToken(uuid);

        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(storedToken);
        given(refreshTokenMapper.revokeByTokenHash(anyString())).willReturn(1);

        // when: 예외 없이 완료되면 성공
        authService.logout(refreshToken, uuid);

        // then: 토큰 조회 후 폐기까지 순서대로 호출됐는지 확인
        verify(refreshTokenMapper).findByTokenHash(anyString());
        verify(refreshTokenMapper).revokeByTokenHash(anyString());
    }

    @Test
    @DisplayName("logout — 실패: null 토큰이면 IllegalArgumentException")
    void logout_nullToken_throwsIllegalArgument() {
        assertThatThrownBy(() -> authService.logout(null, UUID.randomUUID()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("logout — 실패: 토큰이 DB에 없으면 NoSuchElementException")
    void logout_tokenNotFound_throwsNoSuchElement() {
        // given: DB에 해당 토큰 해시가 없는 상황
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(null);

        assertThatThrownBy(() -> authService.logout("unknown.token", UUID.randomUUID()))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("logout — 실패: 폐기 처리(0행 반환)가 실패하면 IllegalStateException")
    void logout_revokeFailure_throwsIllegalState() {
        // DB revokeByTokenHash 가 0을 반환하는 상황 (예: 동시 요청으로 이미 폐기됨)
        UUID uuid = UUID.randomUUID();
        RefreshTokenDTO storedToken = makeActiveRefreshToken(uuid);
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(storedToken);
        given(refreshTokenMapper.revokeByTokenHash(anyString())).willReturn(0); // 폐기 실패

        assertThatThrownBy(() -> authService.logout("some.token", uuid))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("로그아웃 처리에 실패");
    }

    @Test
    @DisplayName("logout — 실패: 다른 사람의 토큰으로 로그아웃 시도 시 SecurityException")
    void logout_otherUserToken_throwsSecurity() {
        // given: 토큰에 저장된 uuid와 로그아웃 요청자의 uuid가 다름
        UUID ownerUuid    = UUID.randomUUID();
        UUID attackerUuid = UUID.randomUUID();

        RefreshTokenDTO storedToken = makeActiveRefreshToken(ownerUuid);
        given(refreshTokenMapper.findByTokenHash(anyString())).willReturn(storedToken);

        // when & then: 본인 것이 아닌 토큰으로 로그아웃 → 보안 예외
        assertThatThrownBy(() -> authService.logout("some.token", attackerUuid))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("본인의 Refresh Token");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. getMe()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMe — 정상: 존재하는 활성 사용자 정보 반환, 비밀번호는 응답에서 제거")
    void getMe_success_passwordNulledOut() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "me@b.com", "$2a$hashed");
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(userMapper.selectCategoryNamesByUserUuid(uuid)).willReturn(List.of("개발·IT"));

        // when
        UserDTO result = authService.getMe(uuid);

        // then: 비밀번호는 null로 처리되어야 하고, 카테고리는 채워져 있어야 함
        assertThat(result.getUserPassword()).isNull();
        assertThat(result.getCategories()).containsExactly("개발·IT");
        assertThat(result.isHasPassword()).isTrue(); // 원래 비밀번호가 있었으므로 true
    }

    @Test
    @DisplayName("getMe — 정상: 소셜 전용 계정(비밀번호 없음)은 hasPassword=false")
    void getMe_socialAccount_hasPasswordFalse() {
        // given: 비밀번호가 null인 소셜 계정
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "social@b.com", null);
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(userMapper.selectCategoryNamesByUserUuid(uuid)).willReturn(List.of());

        // when
        UserDTO result = authService.getMe(uuid);

        // then: hasPassword 는 false 여야 함
        assertThat(result.isHasPassword()).isFalse();
    }

    @Test
    @DisplayName("getMe — 실패: 존재하지 않는 UUID이면 NoSuchElementException")
    void getMe_notFound_throwsNoSuchElement() {
        // given: DB에 해당 UUID 없음
        UUID uuid = UUID.randomUUID();
        given(userMapper.findByUuid(uuid)).willReturn(null);

        assertThatThrownBy(() -> authService.getMe(uuid))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. changePassword()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("changePassword — 정상: 현재 비밀번호 일치 시 변경 성공")
    void changePassword_success() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "u@b.com", "$2a$old");
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(passwordEncoder.matches("oldPw", "$2a$old")).willReturn(true);
        given(passwordEncoder.encode("newPw!1")).willReturn("$2a$new");

        // when: 예외 없이 완료되면 성공
        authService.changePassword(uuid, "oldPw", "newPw!1");

        // then: 비밀번호 업데이트가 실제로 호출됐는지 확인
        verify(userMapper).updatePassword(uuid, "$2a$new");
    }

    @Test
    @DisplayName("changePassword — 실패: 현재 비밀번호 불일치 시 SecurityException")
    void changePassword_wrongCurrentPw_throwsSecurity() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "u@b.com", "$2a$old");
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(passwordEncoder.matches("wrongOld", "$2a$old")).willReturn(false);

        assertThatThrownBy(() -> authService.changePassword(uuid, "wrongOld", "newPw"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("현재 비밀번호");
    }

    @Test
    @DisplayName("changePassword — 실패: 소셜 전용 계정은 비밀번호 변경 불가")
    void changePassword_socialAccount_throwsIllegalState() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "social@b.com", null); // password=null
        given(userMapper.findByUuid(uuid)).willReturn(user);

        assertThatThrownBy(() -> authService.changePassword(uuid, "anything", "newPw"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("소셜 로그인");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. registerPassword()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("registerPassword — 정상: 소셜 계정에 비밀번호를 처음 등록")
    void registerPassword_success() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "social@b.com", null); // 비밀번호 없음
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(passwordEncoder.encode(anyString())).willReturn("$2a$new");

        // when
        authService.registerPassword(uuid, "validPw!1");

        // then: 비밀번호 업데이트 호출 확인
        verify(userMapper).updatePassword(uuid, "$2a$new");
    }

    @Test
    @DisplayName("registerPassword — 실패: 이미 비밀번호가 있는 계정은 IllegalStateException")
    void registerPassword_alreadyHasPw_throwsIllegalState() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "u@b.com", "$2a$existing");
        given(userMapper.findByUuid(uuid)).willReturn(user);

        assertThatThrownBy(() -> authService.registerPassword(uuid, "newPw!1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 비밀번호가 등록");
    }

    @Test
    @DisplayName("registerPassword — 실패: 형식 미달 비밀번호는 IllegalArgumentException")
    void registerPassword_weakPassword_throwsIllegalArgument() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "social@b.com", null);
        given(userMapper.findByUuid(uuid)).willReturn(user);

        // 영문·숫자·특수문자 포함 8~16자 조건을 만족하지 못하는 비밀번호
        assertThatThrownBy(() -> authService.registerPassword(uuid, "1234"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("8~16자리");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7. withdraw()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("withdraw — 정상: 일반 계정, 비밀번호 확인 후 WITHDRAWN 상태로 변경")
    void withdraw_normalAccount_success() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "u@b.com", "$2a$pw");
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(passwordEncoder.matches("myPw", "$2a$pw")).willReturn(true);
        given(userAuthMapper.findByUserUuid(uuid)).willReturn(List.of());

        // when
        authService.withdraw(uuid, "myPw");

        // then: 상태를 WITHDRAWN으로 업데이트하는 메서드가 호출됐는지 확인
        verify(userMapper).updateUserStatus(uuid, "WITHDRAWN");
    }

    @Test
    @DisplayName("withdraw — 정상: 소셜 전용 계정은 비밀번호 없이 탈퇴 가능")
    void withdraw_socialAccount_noPwNeeded() {
        // given: 비밀번호가 없는 소셜 전용 계정
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "social@b.com", null);
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(userAuthMapper.findByUserUuid(uuid)).willReturn(List.of());

        // when: password를 null로 전달해도 예외 없이 탈퇴 처리
        authService.withdraw(uuid, null);

        verify(userMapper).updateUserStatus(uuid, "WITHDRAWN");
    }

    @Test
    @DisplayName("withdraw — 실패: 비밀번호 불일치 시 SecurityException")
    void withdraw_wrongPw_throwsSecurity() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = makeActiveUser(uuid, "u@b.com", "$2a$pw");
        given(userMapper.findByUuid(uuid)).willReturn(user);
        given(passwordEncoder.matches("wrong", "$2a$pw")).willReturn(false);

        assertThatThrownBy(() -> authService.withdraw(uuid, "wrong"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("현재 비밀번호");
    }

    @Test
    @DisplayName("withdraw — 실패: 존재하지 않는 계정이면 NoSuchElementException")
    void withdraw_notFound_throwsNoSuchElement() {
        UUID uuid = UUID.randomUUID();
        given(userMapper.findByUuid(uuid)).willReturn(null);

        assertThatThrownBy(() -> authService.withdraw(uuid, "pw"))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼 메서드
    // (반복되는 객체 생성 코드를 줄여서 테스트 본문이 깔끔하게 유지됨)
    // ────────────────────────────────────────────────────────────────────────

    /** 활성 상태(ACTIVE)의 사용자 UserDTO 생성 */
    private UserDTO makeActiveUser(UUID uuid, String email, String encodedPassword) {
        UserDTO user = new UserDTO();
        user.setUserUuid(uuid);
        user.setUserEmail(email);
        user.setUserPassword(encodedPassword);
        user.setUserStatus("ACTIVE");
        return user;
    }

    /** 로그인 요청용 UserDTO 생성 */
    private UserDTO makeLoginRequest(String email, String rawPassword) {
        UserDTO req = new UserDTO();
        req.setUserEmail(email);
        req.setUserPassword(rawPassword);
        return req;
    }

    /** 유효한 상태(폐기되지 않고, 미래에 만료)의 RefreshTokenDTO 생성 */
    private RefreshTokenDTO makeActiveRefreshToken(UUID userUuid) {
        RefreshTokenDTO token = new RefreshTokenDTO();
        token.setUserUuid(userUuid);
        token.setTokenHash("hashed-token");
        token.setRevoked(false);
        token.setExpiryDate(LocalDateTime.now().plusDays(7)); // 7일 후 만료
        return token;
    }
}
