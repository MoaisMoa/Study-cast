CREATE TABLE ddays (
    dday_no SERIAL NOT NULL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    dday_title VARCHAR(100) NOT NULL,
    dday_type VARCHAR(10) NOT NULL DEFAULT '기타',
    target_date DATE NOT NULL,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_useruuid FOREIGN KEY(user_uuid)
    REFERENCES users(user_uuid) ON DELETE CASCADE
);

COMMENT ON COLUMN ddays.dday_no IS '디데이 고유 번호';
COMMENT ON COLUMN ddays.user_uuid IS '회원 고유 번호';
COMMENT ON COLUMN ddays.dday_title IS '목표 제목';
COMMENT ON COLUMN ddays.dday_type IS '일정 유형 (시험/과제/모임)';
COMMENT ON COLUMN ddays.target_date IS '목표 날짜';
COMMENT ON COLUMN ddays.is_main IS '디데이 화면 노출 여부';
COMMENT ON COLUMN ddays.created_at IS '디데이 생성 시간';
COMMENT ON COLUMN ddays.updated_at IS '디데이 수정 시간';