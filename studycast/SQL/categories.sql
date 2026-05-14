CREATE TABLE categories (
    category_no INT NOT NULL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

COMMENT ON COLUMN category_no IS '카테고리 고유 번호';
COMMENT ON COLUMN category_name IS '카테고리 이름';