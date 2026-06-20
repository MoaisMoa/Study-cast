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
