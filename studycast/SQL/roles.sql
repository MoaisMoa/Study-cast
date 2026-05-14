CREATE TABLE roles (
    role_code SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    
    CONSTRAINT fk_user FOREIGN KEY(user_uuid)
    REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT uq_user_role UNIQUE (user_uuid, role) 
);

COMMENT ON COLUMN roles.rolde_code IS '권한 식별 번호';
COMMENT ON COLUMN roles.user_uuid IS '회원 식별 번호(FK(users.user_uuid))';
COMMENT ON COLUMN roles.role IS '권한 (ADMIN / USER)';