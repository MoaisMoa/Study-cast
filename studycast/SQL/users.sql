CREATE TABLE users (
    user_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_profile_image VARCHAR(255),
    user_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 컬럼 주석
COMMENT ON COLUMN users.user_uuid IS '회원 식별 번호';
COMMENT ON COLUMN users.user_email IS '회원 이메일';
COMMENT ON COLUMN users.user_password IS '회원 비밀번호';
COMMENT ON COLUMN users.user_name IS '회원 이름';
COMMENT ON COLUMN users.user_profile_image IS '회원 프로필 이미지 URL';
COMMENT ON COLUMN users.user_status IS '회원 상태 (ACTIVE, INACTIVE)';
COMMENT ON COLUMN users.created_at IS '회원 가입 일시';
COMMENT ON COLUMN users.updated_at IS '회원 정보 수정 일시';
COMMENT ON COLUMN users.deleted_at IS '회원 탈퇴 일시';