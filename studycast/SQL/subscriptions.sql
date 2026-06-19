-- 구독 정보
CREATE TABLE user_subscriptions (
    subscription_id  BIGSERIAL    PRIMARY KEY,
    user_uuid        UUID         NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    plan             VARCHAR(20)  NOT NULL,                   -- ONE_MONTH | THREE_MONTHS | SIX_MONTHS
    billing_key      VARCHAR(255) NOT NULL,
    customer_key     VARCHAR(100) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | CANCELLED | EXPIRED
    started_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    next_billing_at  TIMESTAMP    NOT NULL,
    cancelled_at     TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 자동결제 스케줄러용 인덱스
CREATE INDEX idx_subscriptions_billing ON user_subscriptions(status, next_billing_at);
-- 사용자당 ACTIVE 구독 1개만 허용
CREATE UNIQUE INDEX idx_subscriptions_active_user ON user_subscriptions(user_uuid)
    WHERE status = 'ACTIVE';

-- 결제 내역
CREATE TABLE payment_history (
    payment_id      BIGSERIAL    PRIMARY KEY,
    user_uuid       UUID         NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    subscription_id BIGINT       REFERENCES user_subscriptions(subscription_id),
    order_id        VARCHAR(100) NOT NULL UNIQUE,
    payment_key     VARCHAR(255),
    amount          INT          NOT NULL,
    plan            VARCHAR(20)  NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING | SUCCESS | FAILED
    paid_at         TIMESTAMP,
    failed_reason   TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user ON payment_history(user_uuid, created_at DESC);
