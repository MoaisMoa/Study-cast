-- 비밀번호 재설정 이메일 인증번호
CREATE TABLE IF NOT EXISTS email_verifications (
    verification_no BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'PASSWORD_RESET',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count INT NOT NULL DEFAULT 0,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    used_at TIMESTAMP,

    CONSTRAINT fk_email_verifications_user
        FOREIGN KEY (user_uuid)
        REFERENCES users(user_uuid)
        ON DELETE CASCADE,
    
    CONSTRAINT chk_email_verifications_purpose
        CHECK (purpose IN ('PASSWORD_RESET', 'SIGNUP_LINK')),
    
    CONSTRAINT chk_email_verifications_attempt_count
        CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_uuid
ON email_verifications(user_uuid);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_purpose
ON email_verifications(user_email, purpose);

-- 컬럼 주석
COMMENT ON TABLE email_verifications IS '이메일 인증번호 저장 테이블';
COMMENT ON COLUMN email_verifications.verification_no IS '인증번호 기록 식별 번호';
COMMENT ON COLUMN email_verifications.user_uuid IS '인증번호 회원 식별';
COMMENT ON COLUMN email_verifications.user_email IS '인증번호를 발송한 이메일';
COMMENT ON COLUMN email_verifications.verification_code IS '인증번호 (BCrypt 해시)';
COMMENT ON COLUMN email_verifications.purpose IS '인증 목적';
COMMENT ON COLUMN email_verifications.verified IS '인증번호 확인 성공 여부';
COMMENT ON COLUMN email_verifications.used IS '비밀번호 변경에 이미 사용했는지 여부 (true 시 재사용 불가)';
COMMENT ON COLUMN email_verifications.attempt_count IS '인증번호 입력 실패 횟수 (3회 제한)';
COMMENT ON COLUMN email_verifications.expiry_date IS '인증번호 만료 시간 (5분 제한)';
COMMENT ON COLUMN email_verifications.created_at IS '인증번호 생성 시간';
COMMENT ON COLUMN email_verifications.verified_at IS '인증번호 확인 성공 시간';
COMMENT ON COLUMN email_verifications.used_at IS '비밀번호 변경 완료 시간';