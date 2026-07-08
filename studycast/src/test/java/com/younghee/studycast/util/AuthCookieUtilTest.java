package com.younghee.studycast.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseCookie;

/**
 * AuthCookieUtil 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * AuthCookieUtil은 JWT 토큰을 HttpOnly 쿠키로 안전하게 다루는 유틸이다.
 * - buildTokenCookie: 토큰을 담은 쿠키 생성
 * - clearTokenCookie : 로그아웃 시 쿠키 삭제용(maxAge=0) 쿠키 생성
 * - extractCookieValue: 요청에서 특정 이름의 쿠키 값 추출
 *
 * ── @Nested 개념 ───────────────────────────────────────────────────────────────
 * @Nested 는 테스트를 그룹으로 묶어 계층 구조를 만들어 준다.
 * 예) "buildTokenCookie — 로컬 환경(secure=false)" 처럼 같은 메서드지만
 *     다른 조건을 별도 그룹으로 구분할 수 있어 가독성이 높아진다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthCookieUtil — JWT 쿠키 생성/삭제/추출 단위 테스트")
class AuthCookieUtilTest {

    // extractCookieValue 테스트에서 HttpServletRequest를 Mock으로 사용
    @Mock
    private HttpServletRequest mockRequest;

    // ── 1. buildTokenCookie — 로컬 환경 (secure=false) ────────────────────────

    @Nested
    @DisplayName("buildTokenCookie — 로컬 환경 (cookie-secure=false)")
    class BuildTokenCookieLocal {

        // 로컬 개발 환경 설정: secure=false
        private final AuthCookieUtil util = new AuthCookieUtil(false);

        @Test
        @DisplayName("쿠키 이름과 값이 정확히 설정됨")
        void buildTokenCookie_hasCorrectNameAndValue() {
            // when
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt-value", 3600);

            // then
            assertThat(cookie.getName()).isEqualTo("sc_access_token");
            assertThat(cookie.getValue()).isEqualTo("jwt-value");
        }

        @Test
        @DisplayName("HttpOnly=true — JavaScript에서 쿠키 접근 불가")
        void buildTokenCookie_isHttpOnly() {
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt", 3600);

            assertThat(cookie.isHttpOnly()).isTrue();
        }

        @Test
        @DisplayName("Secure=false — 로컬 HTTP 환경에서 동작")
        void buildTokenCookie_isNotSecureInLocalEnv() {
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt", 3600);

            assertThat(cookie.isSecure()).isFalse();
        }

        @Test
        @DisplayName("maxAge가 설정한 값(3600초)으로 지정됨")
        void buildTokenCookie_hasCorrectMaxAge() {
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt", 3600);

            assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(3600);
        }

        @Test
        @DisplayName("Path='/' — 모든 경로에서 쿠키 전송")
        void buildTokenCookie_hasRootPath() {
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt", 3600);

            assertThat(cookie.getPath()).isEqualTo("/");
        }

        @Test
        @DisplayName("SameSite=Lax — 로컬 환경에서 일반 내비게이션 쿠키 전송 허용")
        void buildTokenCookie_hasSameSiteLax() {
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt", 3600);

            assertThat(cookie.getSameSite()).isEqualTo("Lax");
        }
    }

    // ── 2. buildTokenCookie — 배포 환경 (secure=true) ─────────────────────────

    @Nested
    @DisplayName("buildTokenCookie — 배포 환경 (cookie-secure=true)")
    class BuildTokenCookieProd {

        private final AuthCookieUtil util = new AuthCookieUtil(true);

        @Test
        @DisplayName("Secure=true — HTTPS 환경에서만 쿠키 전송")
        void buildTokenCookie_isSecureInProdEnv() {
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt", 3600);

            assertThat(cookie.isSecure()).isTrue();
        }

        @Test
        @DisplayName("배포 환경에서도 HttpOnly는 여전히 true")
        void buildTokenCookie_isHttpOnlyInProdEnv() {
            ResponseCookie cookie = util.buildTokenCookie("sc_access_token", "jwt", 3600);

            assertThat(cookie.isHttpOnly()).isTrue();
        }
    }

    // ── 3. clearTokenCookie — 로그아웃용 쿠키 삭제 ────────────────────────────

    @Nested
    @DisplayName("clearTokenCookie — 로그아웃 시 쿠키 삭제")
    class ClearTokenCookie {

        private final AuthCookieUtil util = new AuthCookieUtil(false);

        @Test
        @DisplayName("maxAge=0 — 브라우저가 쿠키를 즉시 삭제함")
        void clearTokenCookie_hasMaxAgeZero() {
            ResponseCookie cookie = util.clearTokenCookie("sc_refresh_token");

            assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(0);
        }

        @Test
        @DisplayName("값이 빈 문자열 — 기존 쿠키 값 제거")
        void clearTokenCookie_hasEmptyValue() {
            ResponseCookie cookie = util.clearTokenCookie("sc_refresh_token");

            assertThat(cookie.getValue()).isEmpty();
        }

        @Test
        @DisplayName("쿠키 이름이 그대로 유지됨")
        void clearTokenCookie_hasCorrectName() {
            ResponseCookie cookie = util.clearTokenCookie("sc_refresh_token");

            assertThat(cookie.getName()).isEqualTo("sc_refresh_token");
        }

        @Test
        @DisplayName("배포 환경(secure=true) — clearTokenCookie도 Secure 속성이 true로 설정됨")
        void clearTokenCookie_secure_true_inProd() {
            // 배포 환경에서는 cookie-secure=true 로 생성된 AuthCookieUtil 사용
            AuthCookieUtil prodUtil = new AuthCookieUtil(true);
            ResponseCookie cookie = prodUtil.clearTokenCookie("sc_refresh_token");

            // then: Secure=true (HTTPS 전용), maxAge=0 (즉시 삭제)
            assertThat(cookie.isSecure()).isTrue();
            assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(0);
        }
    }

    // ── 4. buildCsrfCookie / clearCsrfCookie — 더블 서브밋 쿠키 방식 CSRF 토큰 ──

    @Nested
    @DisplayName("buildCsrfCookie — CSRF 토큰 쿠키 생성")
    class BuildCsrfCookie {

        private final AuthCookieUtil util = new AuthCookieUtil(false);

        @Test
        @DisplayName("HttpOnly=false — 프론트 JS가 값을 읽어 헤더로 되돌려보낼 수 있어야 함")
        void buildCsrfCookie_isNotHttpOnly() {
            ResponseCookie cookie = util.buildCsrfCookie("csrf-value", 3600);

            assertThat(cookie.isHttpOnly()).isFalse();
        }

        @Test
        @DisplayName("쿠키 이름은 sc_csrf_token, 값과 maxAge가 그대로 설정됨")
        void buildCsrfCookie_hasCorrectNameValueAndMaxAge() {
            ResponseCookie cookie = util.buildCsrfCookie("csrf-value", 3600);

            assertThat(cookie.getName()).isEqualTo(AuthCookieUtil.CSRF_TOKEN_COOKIE_NAME);
            assertThat(cookie.getValue()).isEqualTo("csrf-value");
            assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(3600);
        }
    }

    @Nested
    @DisplayName("clearCsrfCookie — 로그아웃 시 CSRF 토큰 쿠키 삭제")
    class ClearCsrfCookie {

        private final AuthCookieUtil util = new AuthCookieUtil(false);

        @Test
        @DisplayName("HttpOnly=false, maxAge=0, 값이 빈 문자열")
        void clearCsrfCookie_hasCorrectAttributes() {
            ResponseCookie cookie = util.clearCsrfCookie();

            assertThat(cookie.isHttpOnly()).isFalse();
            assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(0);
            assertThat(cookie.getValue()).isEmpty();
            assertThat(cookie.getName()).isEqualTo(AuthCookieUtil.CSRF_TOKEN_COOKIE_NAME);
        }
    }

    // ── 5. extractCookieValue — 요청에서 쿠키 값 추출 ─────────────────────────

    @Nested
    @DisplayName("extractCookieValue — HTTP 요청에서 쿠키 값 추출")
    class ExtractCookieValue {

        private final AuthCookieUtil util = new AuthCookieUtil(false);

        @Test
        @DisplayName("요청에 해당 쿠키가 있으면 값 반환")
        void extractCookieValue_found() {
            // given: 요청에 sc_access_token 쿠키가 포함된 상황
            Cookie[] cookies = {
                new Cookie("sc_access_token", "my-jwt-token"),
                new Cookie("other_cookie", "other-value")
            };
            given(mockRequest.getCookies()).willReturn(cookies);

            // when
            String value = util.extractCookieValue(mockRequest, "sc_access_token");

            // then
            assertThat(value).isEqualTo("my-jwt-token");
        }

        @Test
        @DisplayName("요청에 해당 쿠키가 없으면 null 반환")
        void extractCookieValue_notFound() {
            // given: 쿠키 목록에 원하는 쿠키가 없는 상황
            Cookie[] cookies = { new Cookie("other_cookie", "value") };
            given(mockRequest.getCookies()).willReturn(cookies);

            // when
            String value = util.extractCookieValue(mockRequest, "sc_access_token");

            // then
            assertThat(value).isNull();
        }

        @Test
        @DisplayName("요청에 쿠키가 전혀 없으면 null 반환")
        void extractCookieValue_noCookies() {
            // given: 쿠키 자체가 없음 (null 반환)
            given(mockRequest.getCookies()).willReturn(null);

            // when
            String value = util.extractCookieValue(mockRequest, "sc_access_token");

            // then
            assertThat(value).isNull();
        }
    }
}
