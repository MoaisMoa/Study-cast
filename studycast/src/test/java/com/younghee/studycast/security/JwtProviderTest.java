package com.younghee.studycast.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * JwtProvider 단위 테스트
 *
 * ── 테스트 기초 용어 ──────────────────────────────────────────────────────
 * @Test          : 이 메서드가 테스트임을 JUnit에 알려줌. 실행 시 자동으로 호출됨.
 * @BeforeEach    : 각 @Test 메서드가 실행되기 직전에 항상 먼저 실행되는 메서드.
 *                  여기서는 JwtProvider 인스턴스를 새로 만들어 테스트 간 상태를 격리함.
 * @DisplayName   : 테스트 결과 리포트에 표시될 이름. 한국어로 적으면 가독성이 좋음.
 * assertThat     : AssertJ 라이브러리의 검증 메서드. "실제값"이 기대한 조건을 만족하는지 확인.
 *                  예) assertThat(실제값).isEqualTo(기대값) — 두 값이 같으면 통과, 다르면 테스트 실패.
 *
 * ── 테스트 작성 패턴 (given / when / then) ──────────────────────────────
 * given  : 테스트에 필요한 사전 데이터/상태를 준비
 * when   : 실제로 테스트할 동작(메서드 호출 등)을 실행
 * then   : 결과가 기대한 대로인지 검증
 * ──────────────────────────────────────────────────────────────────────────
 */
@DisplayName("JwtProvider — JWT 토큰 생성/검증 단위 테스트")
class JwtProviderTest {

    // 테스트에서 사용할 JwtProvider 인스턴스
    private JwtProvider jwtProvider;

    // 테스트용 시크릿 키 — 실제 운영 키와 무관하게 테스트 안에서만 쓰임
    // HS256은 최소 32바이트(256비트) 키를 요구하므로 충분히 긴 문자열 사용
    private static final String TEST_SECRET =
            "test-secret-key-for-unit-tests-only-32chars!!";

    // Access Token 유효 시간: 30분 (밀리초 단위)
    private static final long ACCESS_MS  = 1800_000L;
    // Refresh Token 유효 시간: 7일 (밀리초 단위)
    private static final long REFRESH_MS = 604_800_000L;

    /**
     * 각 테스트 메서드 실행 전 JwtProvider를 새로 초기화.
     * → 테스트끼리 서로 영향을 주지 않도록 매번 새 객체를 만드는 것이 원칙.
     */
    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider(TEST_SECRET, ACCESS_MS, REFRESH_MS);
    }

    // ── 1. 토큰 생성 ────────────────────────────────────────────────────────

    @Test
    @DisplayName("Access Token 생성 — null이 아닌 문자열 반환")
    void createAccessToken_returnsNonBlankString() {
        // given: 임의의 사용자 UUID
        UUID userUuid = UUID.randomUUID();

        // when: Access Token 생성
        String token = jwtProvider.createAccessToken(userUuid);

        // then: 결과가 null이 아니고, 내용이 있어야 함
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("Refresh Token 생성 — null이 아닌 문자열 반환")
    void createRefreshToken_returnsNonBlankString() {
        // given
        UUID userUuid = UUID.randomUUID();

        // when
        String token = jwtProvider.createRefreshToken(userUuid);

        // then
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("Access Token과 Refresh Token은 서로 다른 값이어야 함")
    void accessAndRefreshTokens_areDifferent() {
        // given
        UUID userUuid = UUID.randomUUID();

        // when
        String access  = jwtProvider.createAccessToken(userUuid);
        String refresh = jwtProvider.createRefreshToken(userUuid);

        // then: 두 토큰은 서로 달라야 함 (발급 시간, 유효기간, type 클레임이 다름)
        assertThat(access).isNotEqualTo(refresh);
    }

    // ── 2. 토큰 검증 ────────────────────────────────────────────────────────

    @Test
    @DisplayName("정상 발급된 토큰은 validateToken이 true를 반환")
    void validateToken_withValidToken_returnsTrue() {
        // given
        String token = jwtProvider.createAccessToken(UUID.randomUUID());

        // when
        boolean result = jwtProvider.validateToken(token);

        // then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("임의 문자열(가짜 토큰)은 validateToken이 false를 반환")
    void validateToken_withFakeToken_returnsFalse() {
        // given: 실제 JWT 형식이 아닌 임의 문자열
        String fakeToken = "this.is.not.a.valid.jwt";

        // when
        boolean result = jwtProvider.validateToken(fakeToken);

        // then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("빈 문자열은 validateToken이 false를 반환")
    void validateToken_withEmptyString_returnsFalse() {
        // given
        String emptyToken = "";

        // when
        boolean result = jwtProvider.validateToken(emptyToken);

        // then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("다른 시크릿으로 서명된 토큰은 validateToken이 false를 반환")
    void validateToken_withTokenSignedByDifferentSecret_returnsFalse() {
        // given: 다른 시크릿으로 만든 JwtProvider로 토큰 생성
        JwtProvider otherProvider = new JwtProvider(
                "completely-different-secret-key-32chars!!", ACCESS_MS, REFRESH_MS);
        String tokenFromOther = otherProvider.createAccessToken(UUID.randomUUID());

        // when: 현재 provider(다른 키)로 검증
        boolean result = jwtProvider.validateToken(tokenFromOther);

        // then: 서명 불일치 → false
        assertThat(result).isFalse();
    }

    // ── 3. 클레임(payload) 추출 ─────────────────────────────────────────────

    @Test
    @DisplayName("getUserUuid — 토큰에서 원래 UUID를 정확히 꺼낼 수 있어야 함")
    void getUserUuid_returnsOriginalUuid() {
        // given: 특정 UUID로 토큰 생성
        UUID originalUuid = UUID.randomUUID();
        String token = jwtProvider.createAccessToken(originalUuid);

        // when: 토큰에서 UUID 추출
        UUID extractedUuid = jwtProvider.getUserUuid(token);

        // then: 꺼낸 UUID가 처음 넣은 것과 같아야 함
        assertThat(extractedUuid).isEqualTo(originalUuid);
    }

    @Test
    @DisplayName("getTokenType — Access Token의 type 클레임은 'ACCESS'")
    void getTokenType_forAccessToken_returnsACCESS() {
        // given
        String token = jwtProvider.createAccessToken(UUID.randomUUID());

        // when
        String type = jwtProvider.getTokenType(token);

        // then
        assertThat(type).isEqualTo("ACCESS");
    }

    @Test
    @DisplayName("getTokenType — Refresh Token의 type 클레임은 'REFRESH'")
    void getTokenType_forRefreshToken_returnsREFRESH() {
        // given
        String token = jwtProvider.createRefreshToken(UUID.randomUUID());

        // when
        String type = jwtProvider.getTokenType(token);

        // then
        assertThat(type).isEqualTo("REFRESH");
    }

    @Test
    @DisplayName("만료 시간이 지난 토큰은 validateToken이 false를 반환")
    void validateToken_withExpiredToken_returnsFalse() {
        // 유효 시간을 -1ms로 설정하면 생성 즉시 만료된 토큰이 됨
        JwtProvider expiredProvider = new JwtProvider(TEST_SECRET, -1L, -1L);
        String expiredToken = expiredProvider.createAccessToken(UUID.randomUUID());

        // when
        boolean result = jwtProvider.validateToken(expiredToken);

        // then: 만료된 토큰이므로 false
        assertThat(result).isFalse();
    }

    // ── 4. 유효 시간 설정 ───────────────────────────────────────────────────

    @Test
    @DisplayName("getAccessTokenValidityMs — 생성자에 넣은 유효 시간을 그대로 반환")
    void getAccessTokenValidityMs_returnsConfiguredValue() {
        // when & then
        assertThat(jwtProvider.getAccessTokenValidityMs()).isEqualTo(ACCESS_MS);
    }

    @Test
    @DisplayName("getRefreshTokenValidityMs — 생성자에 넣은 유효 시간을 그대로 반환")
    void getRefreshTokenValidityMs_returnsConfiguredValue() {
        // when & then
        assertThat(jwtProvider.getRefreshTokenValidityMs()).isEqualTo(REFRESH_MS);
    }
}
