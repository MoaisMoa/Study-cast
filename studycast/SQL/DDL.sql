DROP TABLE IF EXISTS
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
    user_gender VARCHAR(50) NOT NULL DEFAULT '선택안함' CHECK (user_gender IN ('남성', '여성', '선택안함')),
    user_profile_image VARCHAR(255),
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
COMMENT ON COLUMN users.user_profile_image IS '회원 프로필 이미지 URL';
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

-- 3. 소셜 연동 정보
CREATE TABLE IF NOT EXISTS user_auths (
    social_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    social_type VARCHAR(20) NOT NULL,
    social_id VARCHAR(255) NOT NULL UNIQUE,
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_uuid FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);
COMMENT ON COLUMN user_auths.social_no IS '소셜 연동 식별 번호';
COMMENT ON COLUMN user_auths.user_uuid IS '회원 식별 번호(FK)';
COMMENT ON COLUMN user_auths.social_type IS '소셜 로그인 정보 (GOOGLE/KAKAO)';
COMMENT ON COLUMN user_auths.social_id IS '소셜 플랫폼에서 제공하는 식별 값';
COMMENT ON COLUMN user_auths.connected_at IS '소셜 계정 연동한 시각';

-- 4. 권한 관리
CREATE TABLE IF NOT EXISTS roles (
    role_code SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER', 
    
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
    expired_at TIMESTAMP NOT NULL, 

    CONSTRAINT fk_rooms_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_rooms_category FOREIGN KEY(category_no) REFERENCES categories(category_no) ON DELETE CASCADE
);
COMMENT ON COLUMN rooms.room_no IS '방 고유 번호';
COMMENT ON COLUMN rooms.user_uuid IS '회원 식별 번호';
COMMENT ON COLUMN rooms.category_no IS '카테고리 식별 번호';
COMMENT ON COLUMN rooms.room_title IS '목록에 표시될 방 제목';
COMMENT ON COLUMN rooms.room_description IS '방 상세 소개 문구';
COMMENT ON COLUMN rooms.max_users IS '입장 가능한 최대 인원 수';
COMMENT ON COLUMN rooms.room_password IS '비공개 방 비밀번호';
COMMENT ON COLUMN rooms.room_notice IS '방장이 설정한 공지';
COMMENT ON COLUMN rooms.created_at IS '방 개설된 시간';
COMMENT ON COLUMN rooms.room_private IS '방 비공개 여부';
COMMENT ON COLUMN rooms.room_premium IS '방 프리미엄 여부';
COMMENT ON COLUMN rooms.now_users IS '현재 방 참가 인원';
COMMENT ON COLUMN rooms.room_thumbnail IS '썸네일';
COMMENT ON COLUMN rooms.expired_at IS '룸 만료 날짜';

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
COMMENT ON COLUMN room_participants.part_no IS '참여 식별 번호';
COMMENT ON COLUMN room_participants.user_uuid IS '참여 회원 UUID';
COMMENT ON COLUMN room_participants.room_no IS '참여 중인 방 번호';
COMMENT ON COLUMN room_participants.camera_status IS '카메라 켜짐 여부';
COMMENT ON COLUMN room_participants.mic_status IS '마이크 켜짐 여부';

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