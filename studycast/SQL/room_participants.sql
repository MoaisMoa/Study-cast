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
-- 방 상세 페이지 위한 보강 쿼리
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

COMMENT ON COLUMN room_participants.part_no IS '참여 식별 번호';
COMMENT ON COLUMN room_participants.user_uuid IS '참여 회원 UUID';
COMMENT ON COLUMN room_participants.room_no IS '참여 중인 방 번호';
COMMENT ON COLUMN room_participants.camera_status IS '카메라 켜짐 여부';
COMMENT ON COLUMN room_participants.mic_status IS '마이크 켜짐 여부';
COMMENT ON COLUMN room_participants.active IS '현재 방에 접속 중인지 여부';
COMMENT ON COLUMN room_participants.joined_at IS '현재 입장 세션 시작 시간';
COMMENT ON COLUMN room_participants.left_at IS '마지막 퇴장 시간';
COMMENT ON COLUMN room_participants.created_at IS '최초 참여 이력 생성 시간';
COMMENT ON COLUMN room_participants.updated_at IS '참여 상태 마지막 수정 시간';