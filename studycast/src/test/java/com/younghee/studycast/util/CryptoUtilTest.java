package com.younghee.studycast.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * CryptoUtil 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * CryptoUtil 은 구글 Refresh Token처럼 나중에 다시 평문이 필요한 민감값을
 * AES-256-GCM 방식으로 양방향 암호화한다.
 * - encrypt(plain)  : 평문 → 암호문(Base64)
 * - decrypt(encoded): 암호문(Base64) → 평문
 *
 * ── AES-256-GCM 개념 ──────────────────────────────────────────────────────────
 * · AES-256  : 256비트(32바이트) 비밀 키로 암호화
 * · GCM 모드 : 암호화 + 무결성 검증(인증 태그) 동시 수행 → 변조 감지 가능
 * · IV(초기화 벡터) : 매 암호화마다 새로운 랜덤 12바이트 IV 생성
 *                    → 같은 평문이라도 암호문이 매번 달라짐
 *
 * ── @Value 주입 처리 ──────────────────────────────────────────────────────────
 * CryptoUtil 의 base64Key 필드는 @Value 로 주입되므로,
 * 단위 테스트에서는 Spring 컨테이너 없이 ReflectionTestUtils.setField 로
 * 직접 32바이트 테스트 키를 주입한다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@DisplayName("CryptoUtil — AES-256-GCM 양방향 암호화 단위 테스트")
class CryptoUtilTest {

    // 32바이트(256비트) AES 키 = Base64로 인코딩 시 44자 (마지막 '=' 패딩 포함)
    // new byte[32](전부 0x00) 를 Base64 인코딩한 값
    private static final String TEST_KEY_BASE64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    private CryptoUtil cryptoUtil;

    @BeforeEach
    void setUp() {
        cryptoUtil = new CryptoUtil();
        // Spring 없이 @Value 필드를 직접 주입
        ReflectionTestUtils.setField(cryptoUtil, "base64Key", TEST_KEY_BASE64);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. 암호화 → 복호화 왕복 (Round-Trip)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("encrypt → decrypt 왕복: 복호화 결과가 원본 평문과 동일해야 함")
    void encrypt_decrypt_roundTrip_preservesPlaintext() {
        // given: 구글 Refresh Token 형태의 민감값
        String original = "1//0gLtK8D_mXYzAeI3K-l9abc_DEF-xyzABCDEFGHIJK";

        // when
        String encrypted = cryptoUtil.encrypt(original);
        String decrypted = cryptoUtil.decrypt(encrypted);

        // then: 복호화 결과 = 원본
        assertThat(decrypted).isEqualTo(original);
    }

    @Test
    @DisplayName("한글/특수문자 포함 평문도 왕복 정상 처리")
    void encrypt_decrypt_koreanAndSpecialChars_roundTrip() {
        String original = "한글-테스트!@#$%^&*()_+ 공백포함";

        assertThat(cryptoUtil.decrypt(cryptoUtil.encrypt(original))).isEqualTo(original);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. IV 랜덤성 — 같은 평문도 암호화할 때마다 다른 결과
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("같은 평문을 두 번 암호화하면 결과가 달라야 함 (랜덤 IV)")
    void encrypt_sameInput_producesDifferentCiphertext() {
        // GCM 모드는 매번 새 랜덤 IV(12바이트)를 사용하므로 같은 입력도 결과가 달라진다.
        // 이 성질로 인해 암호문 목록을 봐도 어떤 값이 동일한지 알 수 없다 (패턴 노출 방지).
        String plain = "same-token-value";

        String enc1 = cryptoUtil.encrypt(plain);
        String enc2 = cryptoUtil.encrypt(plain);

        assertThat(enc1).isNotEqualTo(enc2);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. 출력 형식
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("암호문은 빈 값이 아니고 Base64 형식이어야 함")
    void encrypt_result_isNotBlankAndIsBase64() {
        String encrypted = cryptoUtil.encrypt("any-value");

        assertThat(encrypted).isNotBlank();
        // Base64 문자: A-Z a-z 0-9 + / =
        assertThat(encrypted).matches("[A-Za-z0-9+/=]+");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. 예외 처리
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("손상된 암호문 복호화 시 IllegalStateException 발생")
    void decrypt_corruptedData_throwsIllegalState() {
        // 유효하지 않은 Base64나 GCM 인증 실패 시 예외
        assertThatThrownBy(() -> cryptoUtil.decrypt("invalid-garbage-not-base64!!"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("복호화에 실패");
    }

    @Test
    @DisplayName("encrypt(null) — NullPointerException이 catch에 잡혀 IllegalStateException 발생")
    void encrypt_null_throwsIllegalState() {
        // plain.getBytes(UTF_8) 호출 시 NPE → catch(Exception e) → IllegalStateException
        assertThatThrownBy(() -> cryptoUtil.encrypt(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("암호화에 실패");
    }

    @Test
    @DisplayName("decrypt(null) — Base64.decode(null) 호출 시 NPE → IllegalStateException")
    void decrypt_null_throwsIllegalState() {
        assertThatThrownBy(() -> cryptoUtil.decrypt(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("복호화에 실패");
    }
}
