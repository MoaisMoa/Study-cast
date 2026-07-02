package com.younghee.studycast.oauth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * OAuthUserInfoFactory 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * OAuthUserInfoFactory.of(registrationId, attributes) 는
 * OAuth provider 이름(google / kakao)에 따라 적절한 OAuthUserInfo 구현체를 반환한다.
 * (팩토리 패턴 — 조건에 따라 다른 객체를 만들어주는 패턴)
 *
 * ── 테스트 포인트 ──────────────────────────────────────────────────────────────
 * 1. "google" → GoogleOAuthUserInfo 반환, 각 필드 정상 추출
 * 2. "kakao"  → KakaoOAuthUserInfo 반환, 각 필드 정상 추출 (중첩 Map 포함)
 * 3. 지원하지 않는 provider → IllegalArgumentException
 * 4. null provider → IllegalArgumentException
 * 5. 속성값이 없는 경우 → null 반환 (NPE 없이)
 * ──────────────────────────────────────────────────────────────────────────────
 */
@DisplayName("OAuthUserInfoFactory — OAuth provider별 사용자 정보 팩토리 단위 테스트")
class OAuthUserInfoFactoryTest {

    // ── 1. Google ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Google — 정상: 'google' provider로 GoogleOAuthUserInfo 반환")
    void of_google_returnsGoogleInfo() {
        // given: Google OAuth2가 전달하는 사용자 정보 형태
        Map<String, Object> attrs = new HashMap<>();
        attrs.put("sub", "google-uid-12345");
        attrs.put("email", "user@gmail.com");
        attrs.put("name", "홍길동");
        attrs.put("picture", "https://lh3.googleusercontent.com/photo.jpg");

        // when
        OAuthUserInfo info = OAuthUserInfoFactory.of("google", attrs);

        // then: 올바른 타입이고 각 필드가 정상적으로 매핑됨
        assertThat(info).isInstanceOf(GoogleOAuthUserInfo.class);
        assertThat(info.getProvider()).isEqualTo("GOOGLE");
        assertThat(info.getProviderUserId()).isEqualTo("google-uid-12345");
        assertThat(info.getEmail()).isEqualTo("user@gmail.com");
        assertThat(info.getName()).isEqualTo("홍길동");
        assertThat(info.getProfileImage()).isEqualTo("https://lh3.googleusercontent.com/photo.jpg");
    }

    @Test
    @DisplayName("Google — 대소문자 무관: 'GOOGLE'도 GoogleOAuthUserInfo 반환")
    void of_GOOGLE_uppercase_returnsGoogleInfo() {
        OAuthUserInfo info = OAuthUserInfoFactory.of("GOOGLE", Map.of("sub", "123"));

        assertThat(info).isInstanceOf(GoogleOAuthUserInfo.class);
    }

    @Test
    @DisplayName("Google — 속성이 없으면 null 반환 (NPE 없이 안전하게 처리)")
    void of_google_missingAttributes_returnsNull() {
        // given: 빈 attributes
        OAuthUserInfo info = OAuthUserInfoFactory.of("google", Map.of());

        // then: NPE 없이 null 반환
        assertThat(info.getProviderUserId()).isNull();
        assertThat(info.getEmail()).isNull();
        assertThat(info.getName()).isNull();
        assertThat(info.getProfileImage()).isNull();
    }

    // ── 2. Kakao ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Kakao — 정상: 'kakao' provider로 KakaoOAuthUserInfo 반환 (중첩 Map 파싱)")
    void of_kakao_returnsKakaoInfo() {
        // given: Kakao OAuth2가 전달하는 사용자 정보 형태 (중첩 구조)
        Map<String, Object> profile = new HashMap<>();
        profile.put("nickname", "카카오유저");
        profile.put("profile_image_url", "https://k.kakaocdn.net/photo.jpg");

        Map<String, Object> kakaoAccount = new HashMap<>();
        kakaoAccount.put("email", "kakao@kakao.com");
        kakaoAccount.put("profile", profile);

        Map<String, Object> attrs = new HashMap<>();
        attrs.put("id", 987654321L);
        attrs.put("kakao_account", kakaoAccount);

        // when
        OAuthUserInfo info = OAuthUserInfoFactory.of("kakao", attrs);

        // then
        assertThat(info).isInstanceOf(KakaoOAuthUserInfo.class);
        assertThat(info.getProvider()).isEqualTo("KAKAO");
        assertThat(info.getProviderUserId()).isEqualTo("987654321");
        assertThat(info.getEmail()).isEqualTo("kakao@kakao.com");
        assertThat(info.getName()).isEqualTo("카카오유저");
        assertThat(info.getProfileImage()).isEqualTo("https://k.kakaocdn.net/photo.jpg");
    }

    @Test
    @DisplayName("Kakao — kakao_account 없으면 이메일/이름/프로필 null 반환 (NPE 없이)")
    void of_kakao_missingKakaoAccount_returnsNull() {
        // given: kakao_account 없이 id만 있는 경우
        OAuthUserInfo info = OAuthUserInfoFactory.of("kakao", Map.of("id", 111L));

        assertThat(info.getProviderUserId()).isEqualTo("111");
        assertThat(info.getEmail()).isNull();
        assertThat(info.getName()).isNull();
        assertThat(info.getProfileImage()).isNull();
    }

    // ── 3. 지원하지 않는 provider ───────────────────────────────────────────────

    @Test
    @DisplayName("지원하지 않는 provider('naver')는 IllegalArgumentException")
    void of_unsupportedProvider_throwsIllegalArgument() {
        assertThatThrownBy(() -> OAuthUserInfoFactory.of("naver", Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("지원하지 않는 OAuth provider");
    }

    @Test
    @DisplayName("null provider는 IllegalArgumentException")
    void of_nullProvider_throwsIllegalArgument() {
        assertThatThrownBy(() -> OAuthUserInfoFactory.of(null, Map.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("빈 문자열 provider는 IllegalArgumentException")
    void of_emptyProvider_throwsIllegalArgument() {
        assertThatThrownBy(() -> OAuthUserInfoFactory.of("", Map.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
