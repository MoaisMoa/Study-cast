CREATE TABLE user_interests (
    interest_no INT NOT NULL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    category_no BIGINT NOT NULL,

    CONSTRAINT fk_user FOREIGN KEY(user_uuid)
    REFERENCES users(user_uuid) ON DELETE CASCADE,

    CONSTRAINT fk_category_no FOREIGN KEY(categories)
    REFERENCES categories(category_no) ON DELETE CASCADE
);

COMMENT interest_no user_interests.interest_no IS '관심사 고유 번호';
COMMENT user_uuid user_interests.user_uuid IS '회원 고유 번호';
COMMENT category_no user_interests.category_no IS '카테고리 고유 번호';