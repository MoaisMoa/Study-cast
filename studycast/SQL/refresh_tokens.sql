CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,

    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_uuid)
        REFERENCES users(user_uuid)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_uuid ON refresh_tokens(user_uuid);

COMMENT ON TABLE refresh_tokens IS 'JWT Refresh Token 저장소';

COMMENT ON COLUMN refresh_tokens.user_uuid IS '회원 UUID';
COMMENT ON COLUMN refresh_tokens.tokens_hash IS 'Refresh Token SHA-256 해시값';
COMMENT ON COLUMN refresh_tokens.expiry_date IS 'Refresh Token 만료 시간';
COMMENT ON COLUMN refresh_tokens.revoked IS '토큰 폐기 여부';