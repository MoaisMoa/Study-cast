CREATE TABLE IF NOT EXISTS user_auths (
    auth_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,

    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_name VARCHAR(255),
    provider_profile_image VARCHAR(255),

    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,

    --users 테이블 외래 키 설정
    CONSTRAINT fk_user_auths_user_uuid
        FOREIGN KEY (user_uuid)
        REFERENCES users(user_uuid)
        ON DELETE CASCADE,
    -- provider + provider_user_id 복합 UNIQUE
    CONSTRAINT uq_user_auths_provider_user_id
        UNIQUE (provider, provider_user_id),
    -- provider 소셜 검증
    CONSTRAINT ck_user_auths_provider
        CHECK (provider IN ('GOOGLE', 'KAKAO'))
);
CREATE INDEX IF NOT EXISTS idx_user_auths_user_uuid
ON user_auths(user_uuid);

-- 주석
COMMENT ON TABLE user_auths IS '회원 소셜 로그인 연동 정보';
COMMENT ON COLUMN user_auths.auth_no IS '소셜 인증 연동 식별 번호';
COMMENT ON COLUMN user_auths.user_uuid IS '회원 식별 번호(FK)';
COMMENT ON COLUMN user_auths.provider IS '소셜 로그인 제공자(GOOGLE, KAKAO)';
COMMENT ON COLUMN user_auths.provider_user_id IS '소셜 플랫폼에서 제공하는 사용자 고유 ID';
COMMENT ON COLUMN user_auths.provider_email IS '소셜 플랫폼에서 제공한 이메일';
COMMENT ON COLUMN user_auths.provider_name IS '소셜 플랫폼에서 제공한 이름 또는 닉네임';
COMMENT ON COLUMN user_auths.provider_profile_image IS '소셜 플랫폼에서 제공한 프로필 이미지 URL';
COMMENT ON COLUMN user_auths.connected_at IS '소셜 계정 최초 연동 시각';
COMMENT ON COLUMN user_auths.last_login_at IS '해당 소셜 계정 마지막 로그인 시각';