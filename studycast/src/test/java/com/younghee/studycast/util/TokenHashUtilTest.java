package com.younghee.studycast.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TokenHashUtil 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * TokenHashUtil.sha256(token) 은 Refresh Token을 SHA-256으로 해싱해서 DB에 저장한다.
 * 원본 토큰은 저장하지 않고 해시값만 저장하므로, DB가 유출되어도 실제 토큰을 알 수 없다.
 *
 * ── 테스트 포인트 ──────────────────────────────────────────────────────────────
 * 1. 같은 입력 → 항상 같은 해시 (결정론적 해시 함수)
 * 2. 다른 입력 → 다른 해시
 * 3. null / 빈 문자열 → 예외 발생
 * 4. 해시 결과는 항상 64자리 16진수 (SHA-256 = 256비트 = 32바이트 = hex 64자)
 * ──────────────────────────────────────────────────────────────────────────────
 */
@DisplayName("TokenHashUtil — SHA-256 해시 유틸 단위 테스트")
class TokenHashUtilTest {

    // ── 1. 결정론적 해시 ─────────────────────────────────────────────────────

    @Test
    @DisplayName("같은 토큰을 두 번 해싱하면 결과가 동일해야 함")
    void sha256_samInput_returnsSameHash() {
        // given
        String token = "eyJhbGciOiJIUzI1NiJ9.example.token";

        // when
        String hash1 = TokenHashUtil.sha256(token);
        String hash2 = TokenHashUtil.sha256(token);

        // then: SHA-256은 결정론적 — 같은 입력은 항상 같은 출력
        assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("다른 토큰은 다른 해시값을 반환해야 함")
    void sha256_differentInput_returnsDifferentHash() {
        // given
        String token1 = "token-aaa";
        String token2 = "token-bbb";

        // when
        String hash1 = TokenHashUtil.sha256(token1);
        String hash2 = TokenHashUtil.sha256(token2);

        // then
        assertThat(hash1).isNotEqualTo(hash2);
    }

    // ── 2. 출력 형식 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("해시 결과는 항상 64자리 16진수 문자열이어야 함")
    void sha256_alwaysReturns64CharHex() {
        // SHA-256 = 256비트 = 32바이트 = 16진수 64자
        String hash = TokenHashUtil.sha256("any-token-value");

        assertThat(hash).hasSize(64);
        // 16진수 문자만 포함 (0-9, a-f)
        assertThat(hash).matches("[0-9a-f]+");
    }

    // ── 3. 예외 처리 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("null 토큰은 RuntimeException 발생")
    void sha256_nullToken_throwsRuntimeException() {
        assertThatThrownBy(() -> TokenHashUtil.sha256(null))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("빈 문자열 토큰은 RuntimeException 발생")
    void sha256_emptyToken_throwsRuntimeException() {
        assertThatThrownBy(() -> TokenHashUtil.sha256(""))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("공백만 있는 토큰은 RuntimeException 발생")
    void sha256_blankToken_throwsRuntimeException() {
        assertThatThrownBy(() -> TokenHashUtil.sha256("   "))
                .isInstanceOf(RuntimeException.class);
    }
}
