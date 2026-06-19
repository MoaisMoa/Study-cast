-- Active: 1778135432146@@127.0.0.1@5432@studycast_db
CREATE TABLE IF NOT EXISTS users (
    user_uuid UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    -- 소셜 전용 가입자 비밀번호X / 일반 로그인 비밀번호O
    user_password VARCHAR(255),
    user_name VARCHAR(255) NOT NULL,
    user_profile_image VARCHAR(255),
    user_gender VARCHAR(20),
    user_birth_date DATE,
    user_bio VARCHAR(20),
    user_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
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
COMMENT ON COLUMN users.user_gender IS '회원 성별';
COMMENT ON COLUMN users.user_birth_date IS '회원 생년월일';
COMMENT ON COLUMN users.user_bio IS '회원 한 줄 각오';
COMMENT ON COLUMN users.user_status IS '회원 상태 (ACTIVE, INACTIVE)';
COMMENT ON COLUMN users.created_at IS '회원 가입 일시';
COMMENT ON COLUMN users.updated_at IS '회원 정보 수정 일시';
COMMENT ON COLUMN users.deleted_at IS '회원 탈퇴 일시';