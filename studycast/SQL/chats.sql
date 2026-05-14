CREATE TABLE IF NOT EXISTS chats (
    chat_no BIGSERIAL NOT NULL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_useruuid FOREIGN KEY(user_uuid)
    REFERENCES users(user_uuid) ON DELETE CASCADE,

    CONSTRAINT fk_roomno FOREIGN KEY(room_no)
    REFERENCES rooms(room_no) ON DELETE CASCADE
);

COMMENT ON COLUMN chats.chat_no IS '채팅 로그 고유 번호';
COMMENT ON COLUMN chats.room_no IS '채팅이 발생한 방 번호';
COMMENT ON COLUMN chats.user_uuid IS '메시지를 보낸 유저';
COMMENT ON COLUMN chats.message IS '채팅 매시지 내용';
COMMENT ON COLUMN chats.sent_at IS '메시지 전송 일시';