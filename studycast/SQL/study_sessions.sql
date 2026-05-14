CREATE TABLE study_sessions (
    session_no SERIAL NOT NULL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,

    CONSTRAINT fk_study_user FOREIGN KEY(user_uuid)
    REFERENCES users(user_uuid) ON DELETE CASCADE,

    CONSTRAINT fk_study_room FOREIGN KEY(room_no)
    REFERENCES rooms(room_no) ON DELETE CASCADE
);

COMMENT ON COLUMN study_sessions.session_no IS '실시간 세션 고유 번호';
COMMENT ON COLUMN study_sessions.room_no IS '스터디룸 고유 번호';
COMMENT ON COLUMN stury_sessions.user_uuid IS '유저 고유 번호';