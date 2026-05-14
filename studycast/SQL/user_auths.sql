CREATE TABLE user_auths (
    social_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    social_type VARCHAR(20) NOT NULL,
    social_id VARCHAR(255) NOT NULL UNIQUE,
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    --users 테이블 외래 키 설정
    CONSTRAINT fk_user_uuid
        FOREIGN KEY (user_uuid)
        REFERENCES users(user_uuid)
        ON DELETE CASCADE
);

-- 주석
COMMENT ON COLUMN user_auths.social_no IS '소셜 연동 식별 번호';
COMMENT ON COLUMN user_auths.user_uuid IS '회원 식별 번호(FK)';
COMMENT ON COLUMN user_auths.social_type IS '소셜 로그인 정보 (GOOGLE/KAKAO)';
COMMENT ON COLUMN user_auths.social_id IS '소셜 플랫폼에서 제공하는 식별 값';
COMMENT ON COLUMN user_auths.connected_at IS '소셜 계정 연동한 시각';