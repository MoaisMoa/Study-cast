-- Active: 1781851343881@@localhost@5432@studycast_db
CREATE TABLE study_logs (
    log_no BIGSERIAL NOT NULL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_seconds INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_study_logs_user
    FOREIGN KEY (user_uuid)
    REFERENCES users(user_uuid)
    ON DELETE CASCADE
);

COMMENT ON COLUMN study_logs.log_no IS '개별 접속 식별 번호';
COMMENT ON COLUMN study_logs.user_uuid IS '회원 식별 번호';
COMMENT ON COLUMN study_logs.study_date IS '공부한 날짜(YYYY-MM-DD)';
COMMENT ON COLUMN study_logs.total_seconds IS '해당 날짜의 누적 공부 시간(초 단위)';
COMMENT ON COLUMN study_logs.updated_at IS '당일 마지막으로 기록이 갱신된 시간';