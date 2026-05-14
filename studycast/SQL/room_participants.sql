CREATE TABLE room_participants (
    part_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    room_no BIGINT NOT NULL,
    camera_status BOOLEAN NOT NULL DEFAULT FALSE,
    mic_status BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_participant_user 
        FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) 
        ON DELETE CASCADE,

    CONSTRAINT fk_participant_room 
        FOREIGN KEY (room_no) REFERENCES rooms(room_no) 
        ON DELETE CASCADE,

    -- 한 유저가 한 방에 두 번 들어가는 것 방지
    CONSTRAINT uq_user_in_room UNIQUE (user_uuid, room_no)
);

COMMENT ON COLUMN room_participants.part_no IS '참여 식별 번호';
COMMENT ON COLUMN room_participants.user_uuid IS '참여 회원 UUID';
COMMENT ON COLUMN room_participants.room_no IS '참여 중인 방 번호';
COMMENT ON COLUMN room_participants.camera_status IS '카메라 켜짐 여부';
COMMENT ON COLUMN room_participants.mic_status IS '마이크 켜짐 여부';