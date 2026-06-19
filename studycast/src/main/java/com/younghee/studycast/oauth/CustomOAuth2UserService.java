package com.younghee.studycast.oauth;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.RoleMapper;
import com.younghee.studycast.dao.UserAuthMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.UserAuthDTO;
import com.younghee.studycast.dto.UserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
// OAuth 제공자에서 받은 사용자 정보를 DB users/user_auths와 연결하는 서비스
public class CustomOAuth2UserService extends DefaultOAuth2UserService{
    
    private final UserMapper userMapper;
    private final UserAuthMapper userAuthMapper;
    private final RoleMapper roleMapper;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 기본 OAuth2UserService 통해 Provider 사용자 정보 조회
        OAuth2User oAuth2User = super.loadUser(userRequest);
        // 2. registrationId 추출
        String registrationId = userRequest.getClientRegistration()
                                            .getRegistrationId();
        // 3. provider별 사용자 정보 구조를 공통 형태로 변환
        OAuthUserInfo oAuthUserInfo = OAuthUserInfoFactory.of(registrationId, oAuth2User.getAttributes());
        // 4. OAuth 사용자 정보 필수값 검증
        validateOAuthUserInfo(oAuthUserInfo);
        // 5. provider + providerUserId 기준으로 소셜 연동 정보 조회
        UserAuthDTO userAuth = userAuthMapper.findByProviderAndProviderUserId(
            oAuthUserInfo.getProvider(), 
            oAuthUserInfo.getProviderUserId()
        );

        UserDTO user;

        // 6. 소셜 연동 되어 있는지 여부 확인
        if (userAuth != null) {
            user = loginLinkedOAuthUser(userAuth);
        } else {
            user = linkOrCreateOAuthUser(oAuthUserInfo);
        }
        // 7. 계정 상태 확인 - 제거
        // validateActiveUser(user);
        // 8. 권한 조회
        List<SimpleGrantedAuthority> authorities = getAuthorities(user.getUserUuid());

        log.info("OAuth 로그인 처리 완료: provider={}, userUuid={}, email={}",
            oAuthUserInfo.getProvider(), user.getUserUuid(), user.getUserEmail()
        );

        // 9. Spring Security에 저장할 OAuth2User 반환
        return new StudycastOAuth2User(
            user.getUserUuid(),
            user.getUserEmail(),
            user.getUserName(),
            authorities,
            oAuth2User.getAttributes()
        );
    }
    
    // 이미 user_auths에 연동 정보가 있는 OAuth 사용자 로그인 처리
    private UserDTO loginLinkedOAuthUser(UserAuthDTO userAuth) {
        UserDTO user = userMapper.findByUuid(userAuth.getUserUuid());

        if (user == null) {
            throw oAuthException("소셜 로그인에 연결된 회원을 찾을 수 없습니다.");
        }

        // 수정) 비활성/탈퇴 계정은 마지막 로그인 시간 갱신 전에 차단
        validateActiveUser(user);

        // 프로필 이미지가 없는 경우에만 소셜 이미지로 업데이트
        if (user.getUserProfileImage() == null || user.getUserProfileImage().isBlank()) {
            String socialImage = userAuth.getProviderProfileImage();
            if (socialImage != null && !socialImage.isBlank()) {
                userMapper.updateProfileImage(user.getUserUuid(), socialImage);
                user.setUserProfileImage(socialImage);
            }
        }

        // 소셜 계정 마지막 로그인 시간 갱신
        userAuthMapper.updateLastLoginAt(userAuth.getAuthNo());

        return user;
    }

    // 신규 OAuth 사용자 처리
    private UserDTO linkOrCreateOAuthUser(OAuthUserInfo oAuthUserInfo) {
        String email = normalizeEmail(oAuthUserInfo.getEmail());

        // 1. 이메일 기준으로 기존 일반 계정 또는 다른 소셜 계정 사용자 조회
        UserDTO user = userMapper.findByEmail(email);

        if (user == null) {
            // 2. 기존 회원이 없으면 OAuth 신규 회원 생성
            user = createOAuthUser(oAuthUserInfo, email);
        } else {
            // 3. 기존 회원이 있으면 상태 확인 후 소셜 계정 연결
            validateActiveUser(user);
            // 4. 프로필 이미지가 없는 경우에만 소셜 이미지로 업데이트
            if (user.getUserProfileImage() == null || user.getUserProfileImage().isBlank()) {
                String socialImage = oAuthUserInfo.getProfileImage();
                if (socialImage != null && !socialImage.isBlank()) {
                    userMapper.updateProfileImage(user.getUserUuid(), socialImage);
                    user.setUserProfileImage(socialImage);
                }
            }
        }
        // 4. user_auths에 소셜 연동 정보 저장
        UserAuthDTO userAuth = createUserAuth(user.getUserUuid(), oAuthUserInfo, email);
        userAuthMapper.insertUserAuth(userAuth);

        return user;
    }
    // OAuth 신규 회원 생성
    private UserDTO createOAuthUser(OAuthUserInfo oAuthUserInfo, String email) {
        UserDTO user = new UserDTO();

        user.setUserUuid(UUID.randomUUID());
        user.setUserEmail(email);
        user.setUserPassword(null);
        user.setUserName(resolveName(oAuthUserInfo, email));
        user.setUserProfileImage(oAuthUserInfo.getProfileImage());
        user.setUserStatus("ACTIVE");

        int result = userMapper.insertUser(user);

        if (result != 1) {
            throw new IllegalStateException("소셜 회원 생성에 실패했습니다.");
        }

        // 신규 회원 기본 권한 부여
        roleMapper.insertDefaultRole(user.getUserUuid());

        log.info("OAuth 신규 회원 생성: provider={}, userUuid={}, email={}",
            oAuthUserInfo.getProvider(), user.getUserUuid(), email
        );

        return user;
    }

    // user_auths 저장용 DTO 생성
    private UserAuthDTO createUserAuth(UUID userUuid, OAuthUserInfo oAuthUserInfo, String email) {
        UserAuthDTO userAuth = new UserAuthDTO();

        userAuth.setUserUuid(userUuid);
        userAuth.setProvider(oAuthUserInfo.getProvider());
        userAuth.setProviderUserId(oAuthUserInfo.getProviderUserId());
        userAuth.setProviderEmail(email);
        userAuth.setProviderName(oAuthUserInfo.getName());
        userAuth.setProviderProfileImage(oAuthUserInfo.getProfileImage());

        return userAuth;
    }

    // loadUser() 검증 예외
    private OAuth2AuthenticationException oAuthException(String message) {
        OAuth2Error error = new OAuth2Error("oAuth_login_failed", message, null);
        return new OAuth2AuthenticationException(error, message);
    }

    // OAuth 사용자 정보 필수값 검증
    private void validateOAuthUserInfo(OAuthUserInfo oAuthUserInfo) {
        if (oAuthUserInfo.getProvider() == null || oAuthUserInfo.getProvider().isBlank()) {
            throw oAuthException("OAuth provider 정보가 없습니다.");
        }
        if (oAuthUserInfo.getProviderUserId() == null || oAuthUserInfo.getProviderUserId().isBlank()) {
            throw oAuthException("OAuth 사용자 식별값이 없습니다.");
        }
        if (oAuthUserInfo.getEmail() == null || oAuthUserInfo.getEmail().isBlank()) {
            throw oAuthException("이메일 제공에 동의해야 소셜 로그인을 사용할 수 있습니다.");
        }
    }

    // 회원 상태 검증
    private void validateActiveUser(UserDTO user) {
        if (!"ACTIVE".equals(user.getUserStatus())) {
            throw oAuthException("사용할 수 없는 계정입니다.");
        }
    }

    // 이메일 정규화
    private String normalizeEmail(String email) {
        // 이메일 비교/통합 기준이므로 앞뒤 공백 제거 후 소문자로 통일
        return email.trim().toLowerCase();
    }

    // OAuth 제공자에서 이름을 주지 않은 경우 이메일 앞부분을 기본 이름으로 사용
    private String resolveName(OAuthUserInfo oAuthUserInfo, String email) {
        String name = oAuthUserInfo.getName();

        if (name != null && !name.isBlank()) {
            return name;
        }

        return email.split("@")[0];
    }

    // 사용자 권한 목록 조회
    private List<SimpleGrantedAuthority> getAuthorities(UUID userUuid) {
        List<String> roles = roleMapper.findRolesByUserUuid(userUuid);

        // roles 권한 없으면 기본 ROLE_USER 부여
        if (roles == null || roles.isEmpty()) {
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .toList();
    }

}
