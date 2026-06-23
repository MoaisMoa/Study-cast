DROP TABLE IF EXISTS
    email_verifications,
    refresh_tokens,
    user_auths,
    roles,
    user_interests,
    room_participants,
    room_visit_histories,
    study_logs,
    study_sessions,
    ddays,
    chats,
    rooms,
    categories,
    users,
    week_plans
CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 회원 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    user_uuid UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    -- 소셜 전용 가입자 비밀번호X / 일반 로그인 비밀번호O
    user_password VARCHAR(255),
    user_name VARCHAR(255) NOT NULL,
    user_gender VARCHAR(50) NOT NULL DEFAULT '설정 안 함' CHECK (user_gender IN ('남자', '여자', '설정 안 함')),
    user_birth_date DATE,
    user_profile_image TEXT,
    user_motto VARCHAR(255),
    user_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (user_status IN ('ACTIVE', 'WITHDRAWN')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);
COMMENT ON COLUMN users.user_uuid IS '회원 식별 번호';
COMMENT ON COLUMN users.user_email IS '회원 이메일';
COMMENT ON COLUMN users.user_password IS '회원 비밀번호';
COMMENT ON COLUMN users.user_name IS '회원 이름';
COMMENT ON COLUMN users.user_gender IS '회원 성별 (남성, 여성, 선택안함)';
COMMENT ON COLUMN users.user_birth_date IS '회원 생년월일';
COMMENT ON COLUMN users.user_profile_image IS '회원 프로필 이미지 URL';
COMMENT ON COLUMN users.user_motto IS '회원 한 줄 각오';
COMMENT ON COLUMN users.user_status IS '회원 상태 (ACTIVE, WITHDRAWN)';
COMMENT ON COLUMN users.created_at IS '회원 가입 일시';
COMMENT ON COLUMN users.updated_at IS '회원 정보 수정 일시';
COMMENT ON COLUMN users.deleted_at IS '회원 탈퇴 일시';

-- 2. 카테고리
CREATE TABLE IF NOT EXISTS categories (
    category_no INT NOT NULL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);
COMMENT ON COLUMN categories.category_no IS '카테고리 고유 번호';
COMMENT ON COLUMN categories.category_name IS '카테고리 이름';

-- 3. 소셜 연동 정보 (수정)
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

    CONSTRAINT fk_user_auths_user_uuid --users 테이블 외래 키 설정
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

-- 4. 권한 관리
CREATE TABLE IF NOT EXISTS roles (
    role_code SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER', -- ROLE_USER 권한 부여 (기본값)
    
    CONSTRAINT fk_roles_user FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT uq_user_role UNIQUE (user_uuid, role) 
);
COMMENT ON COLUMN roles.role_code IS '권한 식별 번호';
COMMENT ON COLUMN roles.user_uuid IS '회원 식별 번호(FK(users.user_uuid))';
COMMENT ON COLUMN roles.role IS '권한 (ADMIN / USER)';

-- 5. 유저 관심사
CREATE TABLE IF NOT EXISTS user_interests (
    interest_no SERIAL PRIMARY KEY, 
    user_uuid UUID NOT NULL,
    category_no INT NOT NULL, 

    CONSTRAINT fk_user_interest FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_category_no FOREIGN KEY(category_no) REFERENCES categories(category_no) ON DELETE CASCADE 
);
COMMENT ON COLUMN user_interests.interest_no IS '관심사 고유 번호';
COMMENT ON COLUMN user_interests.user_uuid IS '회원 고유 번호';
COMMENT ON COLUMN user_interests.category_no IS '카테고리 고유 번호';

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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NOT NULL, 

    CONSTRAINT fk_rooms_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_rooms_category FOREIGN KEY(category_no) REFERENCES categories(category_no) ON DELETE CASCADE
);
-- 6-1. 비공개 방 참여코드만 중복 금지 (동시 요청 포함)
CREATE UNIQUE INDEX uq_rooms_private_password
ON rooms (room_password)
WHERE room_private = TRUE
    AND room_password IS NOT NULL;

-- 6-2. 장치 설정 기본값 (방 생성 시 설정한 카메라/마이크 on/off)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS camera_status BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS mic_status    BOOLEAN NOT NULL DEFAULT FALSE;

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
-- 7-1. 방 상세 페이지 위한 보강 쿼리
ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS left_at TIMESTAMP;

ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7-1-1. 이 방에서의 누적 공부 시간(초) — 재입장 시 0으로 초기화됨 (메인페이지 방별 평균 공부 시간 계산용)
ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS study_seconds INT NOT NULL DEFAULT 0;
-- 7-2. 참여자 목록 조회, 현재 인원 재계산, active 여부 확인 -> 자주 사용(인덱스)
CREATE INDEX IF NOT EXISTS idx_room_participants_room_active
ON room_participants(room_no, active);

CREATE INDEX IF NOT EXISTS idx_room_participants_user_active
ON room_participants(user_uuid, active);
COMMENT ON COLUMN room_participants.part_no IS '참여 식별 번호';
COMMENT ON COLUMN room_participants.user_uuid IS '참여 회원 UUID';
COMMENT ON COLUMN room_participants.room_no IS '참여 중인 방 번호';
COMMENT ON COLUMN room_participants.camera_status IS '카메라 켜짐 여부';
COMMENT ON COLUMN room_participants.mic_status IS '마이크 켜짐 여부';
COMMENT ON COLUMN room_participants.study_seconds IS '이 방에서의 누적 공부 시간(초), 재입장 시 0으로 초기화';

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
COMMENT ON COLUMN room_visit_histories.history_no IS '방문 기록 식별 번호';
COMMENT ON COLUMN room_visit_histories.room_no IS '방문한 룸 번호';
COMMENT ON COLUMN room_visit_histories.user_uuid IS '방문한 회원 UUID';
COMMENT ON COLUMN room_visit_histories.visit_count IS '해당 방 총 방문 횟수';
COMMENT ON COLUMN room_visit_histories.last_visited_at IS '최근 방문 일시';

-- 9. 공부 시간 로그 (타이머 기록용)
CREATE TABLE IF NOT EXISTS study_logs (
    log_no BIGSERIAL NOT NULL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_seconds INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_study_logs_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT uq_user_date UNIQUE (user_uuid, study_date)
);
COMMENT ON COLUMN study_logs.log_no IS '개별 접속 식별 번호';
COMMENT ON COLUMN study_logs.user_uuid IS '회원 식별 번호';
COMMENT ON COLUMN study_logs.study_date IS '공부한 날짜(YYYY-MM-DD)';
COMMENT ON COLUMN study_logs.total_seconds IS '해당 날짜의 누적 공부 시간(초 단위)';
COMMENT ON COLUMN study_logs.updated_at IS '당일 마지막으로 기록이 갱신된 시간';

-- 10. 실시간 세션
CREATE TABLE IF NOT EXISTS study_sessions (
    session_no SERIAL NOT NULL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,

    CONSTRAINT fk_study_user FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_study_room FOREIGN KEY(room_no) REFERENCES rooms(room_no) ON DELETE CASCADE
);
COMMENT ON COLUMN study_sessions.session_no IS '실시간 세션 고유 번호';
COMMENT ON COLUMN study_sessions.room_no IS '스터디룸 고유 번호';
COMMENT ON COLUMN study_sessions.user_uuid IS '유저 고유 번호';

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
COMMENT ON COLUMN ddays.dday_no IS '디데이 고유 번호';
COMMENT ON COLUMN ddays.user_uuid IS '회원 고유 번호';
COMMENT ON COLUMN ddays.dday_title IS '목표 제목';
COMMENT ON COLUMN ddays.target_date IS '목표 날짜';
COMMENT ON COLUMN ddays.is_main IS '디데이 화면 노출 여부';
COMMENT ON COLUMN ddays.created_at IS '디데이 생성 시간';
COMMENT ON COLUMN ddays.updated_at IS '디데이 수정 시간';

-- 12. 채팅
CREATE TABLE IF NOT EXISTS chats (
    chat_no BIGSERIAL NOT NULL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chats_user FOREIGN KEY(user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_roomno FOREIGN KEY(room_no) REFERENCES rooms(room_no) ON DELETE CASCADE
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

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);
COMMENT ON TABLE refresh_tokens IS 'JWT Refresh Token 저장소';
COMMENT ON COLUMN refresh_tokens.token_no IS '토큰 고유 번호';
COMMENT ON COLUMN refresh_tokens.user_uuid IS '회원 UUID';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Refresh Token SHA-256 해시값';
COMMENT ON COLUMN refresh_tokens.expiry_date IS 'Refresh Token 만료 시간';
COMMENT ON COLUMN refresh_tokens.revoked IS '토큰 폐기 여부';
COMMENT ON COLUMN refresh_tokens.created_at IS '생성 일시';

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

-- 15. 플래너
CREATE TABLE week_plans (
    plan_no    SERIAL       NOT NULL PRIMARY KEY,
    user_uuid  UUID         NOT NULL,
    day_of_week SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    title      VARCHAR(30)  NOT NULL,
    color      VARCHAR(10)  NOT NULL DEFAULT '#E57373',
    start_time VARCHAR(5)   NOT NULL,
    end_time   VARCHAR(5)   NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_week_plan_user FOREIGN KEY (user_uuid)
        REFERENCES users(user_uuid) ON DELETE CASCADE
);

COMMENT ON COLUMN week_plans.plan_no     IS '계획 고유 번호';
COMMENT ON COLUMN week_plans.user_uuid   IS '회원 고유 번호';
COMMENT ON COLUMN week_plans.day_of_week IS '요일 (0=월 ~ 6=일)';
COMMENT ON COLUMN week_plans.title       IS '계획 제목';
COMMENT ON COLUMN week_plans.color       IS '블록 색상 (HEX)';
COMMENT ON COLUMN week_plans.start_time  IS '시작 시간 HH:MM';
COMMENT ON COLUMN week_plans.end_time    IS '종료 시간 HH:MM';
