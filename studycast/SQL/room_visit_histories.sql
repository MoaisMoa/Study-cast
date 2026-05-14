CREATE TABLE room_visit_histories (
    history_no BIGSERIAL PRIMARY KEY,
    room_no BIGINT NOT NULL,
    user_uuid UUID NOT NULL,
    visit_count INT NOT NULL DEFAULT 1,
    last_visited_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_visit_user FOREIGN KEY(user_uuid)
        REFERENCES users(user_uuid) ON DELETE CASCADE,

    CONSTRAINT fk_visit_room FOREIGN KEY(room_no)
        REFERENCES rooms(room_no) ON DELETE CASCADE,

    -- 한 유저가 한 방에 대해 하나의 기록만 갖도록 설정
    CONSTRAINT uq_user_room_history UNIQUE (user_uuid, room_no)
);

-- 컬럼 주석
COMMENT ON COLUMN room_visit_histories.history_no IS '방문 기록 식별 번호';
COMMENT ON COLUMN room_visit_histories.room_no IS '방문한 룸 번호';
COMMENT ON COLUMN room_visit_histories.user_uuid IS '방문한 회원 UUID';
COMMENT ON COLUMN room_visit_histories.visit_count IS '해당 방 총 방문 횟수';
COMMENT ON COLUMN room_visit_histories.last_visited_at IS '최근 방문 일시';