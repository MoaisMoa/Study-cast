CREATE TABLE rooms (
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

    CONSTRAINT fk_rooms_user FOREIGN KEY (user_uuid)
    REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_rooms_category FOREIGN KEY(category_no)
    REFERENCES categories(category_no) ON DELETE CASCADE
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
COMMENT ON COLUMN rooms.updated_at IS '방 수정 시간';