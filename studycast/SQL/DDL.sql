-- Active: 1779245779408@@localhost@5432@studycast_db@public
-- 테이블 삭제 (CASCADE로 제약조건까지 깔끔하게 제거)
DROP TABLE IF EXISTS
    email_verifications,
    refresh_tokens,
    users,
    user_auths,
    roles,
    user_interests,
    rooms,
    categories,
    room_participants,
    room_visit_histories,
    study_logs,
    study_sessions,
    ddays,
    chats
CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 회원 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    user_uuid UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_profile_image VARCHAR(255),
    user_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 2. 카테고리 (다른 테이블들이 참조하므로 먼저 생성)
CREATE TABLE IF NOT EXISTS categories (
    category_no INT NOT NULL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. 소셜 연동 정보
CREATE TABLE IF NOT EXISTS user_auths (
    social_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    social_type VARCHAR(20) NOT NULL,
    social_id VARCHAR(255) NOT NULL UNIQUE,
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 오타 수정

    CONSTRAINT fk_user_uuid FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);

-- 4. 권한 관리
CREATE TABLE IF NOT EXISTS roles (
    role_code SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',  -- ROLE_USER 권한 부여 (기본값))
    
    CONSTRAINT fk_roles_user FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT uq_user_role UNIQUE (user_uuid, role) 
);

-- 5. 유저 관심사
CREATE TABLE IF NOT EXISTS user_interests (
    interest_no SERIAL PRIMARY KEY, -- SERIAL 권장
    user_uuid UUID NOT NULL,
    category_no INT NOT NULL, -- 타입 일치

    CONSTRAINT fk_user_interest FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_category_no FOREIGN KEY(category_no) REFERENCES categories(category_no) ON DELETE CASCADE -- 참조 컬럼 수정
);

-- 6. 스터디룸
CREATE TABLE IF NOT EXISTS rooms (
    room_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    category_no INT NOT NULL,
    room_title VARCHAR(100) NOT NULL,
    room_description TEXT,
    max_users INT NOT NULL DEFAULT 4,
    now_users INT NOT NULL DEFAULT 1,
    room_password VARCHAR(10),
    room_notice TEXT,
    room_private BOOLEAN NOT NULL DEFAULT FALSE,
    room_premium BOOLEAN NOT NULL DEFAULT FALSE,
    room_thumbnail VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NOT NULL, 

    CONSTRAINT fk_rooms_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_rooms_category FOREIGN KEY(category_no) REFERENCES categories(category_no) ON DELETE CASCADE
);

-- 7. 룸 참여자 정보
CREATE TABLE IF NOT EXISTS room_participants (
    part_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    room_no BIGINT NOT NULL,
    camera_status BOOLEAN NOT NULL DEFAULT FALSE,
    mic_status BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_participant_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_participant_room FOREIGN KEY (room_no) REFERENCES rooms(room_no) ON DELETE CASCADE,
    CONSTRAINT uq_user_in_room UNIQUE (user_uuid, room_no)
);

-- 8. 룸 방문 기록
CREATE TABLE IF NOT EXISTS room_visit_histories (
    history_no BIGSERIAL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,
    visit_count INT NOT NULL DEFAULT 1,
    last_visited_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_visit_user FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_visit_room FOREIGN KEY(room_no) REFERENCES rooms(room_no) ON DELETE CASCADE,
    CONSTRAINT uq_user_room_history UNIQUE (user_uuid, room_no)
);

-- 9. 공부 시간 로그 (타이머 기록용)
CREATE TABLE IF NOT EXISTS study_logs (
    log_no BIGSERIAL NOT NULL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_seconds INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_study_logs_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT uq_user_date UNIQUE (user_uuid, study_date) -- 하루 한 줄 보장
);

-- 10. 실시간 세션
CREATE TABLE IF NOT EXISTS study_sessions (
    session_no SERIAL NOT NULL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,

    CONSTRAINT fk_study_user FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_study_room FOREIGN KEY(room_no) REFERENCES rooms(room_no) ON DELETE CASCADE
);

-- 11. 디데이
CREATE TABLE IF NOT EXISTS ddays (
    dday_no SERIAL NOT NULL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    dday_title VARCHAR(100) NOT NULL,
    target_date DATE NOT NULL,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ddays_user FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);

-- COMMENT 설정 (생략된 부분 보완)
COMMENT ON COLUMN users.user_uuid IS '회원 식별 번호';
COMMENT ON COLUMN roles.role_code IS '권한 식별 번호';
COMMENT ON COLUMN categories.category_no IS '카테고리 고유 번호';
COMMENT ON COLUMN study_sessions.user_uuid IS '유저 고유 번호';

CREATE TABLE IF NOT EXISTS chats (
    chat_no BIGSERIAL NOT NULL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chats_user FOREIGN KEY(user_uuid)
    REFERENCES users(user_uuid) ON DELETE CASCADE,

    CONSTRAINT fk_roomno FOREIGN KEY(room_no)
    REFERENCES rooms(room_no) ON DELETE CASCADE
);

COMMENT ON COLUMN chats.chat_no IS '채팅 로그 고유 번호';
COMMENT ON COLUMN chats.room_no IS '채팅이 발생한 방 번호';
COMMENT ON COLUMN chats.user_uuid IS '메시지를 보낸 유저';
COMMENT ON COLUMN chats.message IS '채팅 매시지 내용';
COMMENT ON COLUMN chats.sent_at IS '메시지 전송 일시';

-- 13. JWT 로그아웃 처리
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,

    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_uuid)
        REFERENCES users(user_uuid)
        ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_uuid ON refresh_tokens(user_uuid);

-- 14. 이메일 인증 (비밀번호 찾기)
CREATE TABLE IF NOT EXISTS email_verifications (
    verification_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'PASSWORD_RESET',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count INT NOT NULL DEFAULT 0,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    used_at TIMESTAMP,

    CONSTRAINT fk_email_verifications_user
        FOREIGN KEY (user_uuid)
        REFERENCES users(user_uuid)
        ON DELETE CASCADE,
    
    CONSTRAINT chk_email_verifications_purpose
        CHECK (purpose IN ('PASSWORD_RESET')),
    
    CONSTRAINT chk_email_verifications_attempt_count
        CHECK (attempt_count >= 0)
);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_uuid
ON email_verifications(user_uuid);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_purpose
ON email_verifications(user_email, purpose);