-- Active: 1779245779408@@localhost@5432@studycast_db@public

-- =====================================================================
-- 0. 재실행 전 기존 데이터 초기화
-- =====================================================================
-- 테스트 유저 삭제 → CASCADE로 rooms, room_visit_histories, roles 등 연쇄 삭제
DELETE FROM users WHERE user_email IN (
    'test1@studycast.com',
    'test2@studycast.com',
    'test3@studycast.com'
);
-- categories는 CASCADE 대상이 없으므로 별도 처리
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
-- 시퀀스 초기화 (재실행 시 room_no, history_no를 1부터 다시 시작)
ALTER SEQUENCE rooms_room_no_seq                    RESTART WITH 1;
ALTER SEQUENCE room_visit_histories_history_no_seq  RESTART WITH 1;

-- =====================================================================
-- 1. 임시 사용자 3명
--    user_password NULL → 소셜 전용 테스트 계정 (비밀번호 로그인 불가)
--    김지훈(test1): 어학·공무원 담당
--    이수민(test2): 개발·자격증 담당
--    박준영(test3): 취업·대학생 담당 / 방문 기록 기준 유저
-- =====================================================================
INSERT INTO users (user_uuid, user_email, user_password, user_name, user_profile_image, user_status) VALUES
('11111111-1111-1111-1111-111111111111', 'test1@studycast.com', NULL, '김지훈', 'https://picsum.photos/seed/user1/100/100', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'test2@studycast.com', NULL, '이수민', 'https://picsum.photos/seed/user2/100/100', 'ACTIVE'),
('33333333-3333-3333-3333-333333333333', 'test3@studycast.com', NULL, '박준영', 'https://picsum.photos/seed/user3/100/100', 'ACTIVE');

INSERT INTO roles (user_uuid, role) VALUES
('11111111-1111-1111-1111-111111111111', 'ROLE_USER'),
('22222222-2222-2222-2222-222222222222', 'ROLE_USER'),
('33333333-3333-3333-3333-333333333333', 'ROLE_USER');

-- =====================================================================
-- 2. 카테고리
-- =====================================================================
INSERT INTO categories (category_no, category_name) VALUES
(1, '어학'),
(2, '공무원'),
(3, '개발·IT'),
(4, '자격증'),
(5, '취업·면접'),
(6, '대학생');

-- =====================================================================
-- 3. 스터디방 (공개 12 + 비공개 5 = 17개)
--    김지훈(test1) : 어학 2 + 공무원 2 + 비공개 1 = 5개
--    이수민(test2) : 개발 2 + 자격증 2 + 비공개 2 = 6개
--    박준영(test3) : 취업 2 + 대학생 2 + 비공개 2 = 6개
--    now_users: 방 상세 페이지 UI 테스트용 임의값 (운영에서는 서버가 관리)
-- =====================================================================
INSERT INTO rooms (
    user_uuid, category_no, room_title,
    max_users, now_users, room_password, room_notice,
    room_private, room_premium, room_thumbnail,
    created_at, updated_at, expired_at
) VALUES
-- 김지훈 (test1) -------------------------------------------------------
('11111111-1111-1111-1111-111111111111', 1, '토익 900 목표반',               4, 2, NULL,   '매일 단어 인증합니다.',          FALSE, FALSE, 'https://picsum.photos/seed/study1/400/300',  NOW() - INTERVAL '1 day',   NOW(), NOW() + INTERVAL '40 days'),
('11111111-1111-1111-1111-111111111111', 1, '오픽 AL 준비방',                4, 1, NULL,   '저녁마다 말하기 연습',           FALSE, FALSE, 'https://picsum.photos/seed/study2/400/300',  NOW() - INTERVAL '2 days',  NOW(), NOW() + INTERVAL '35 days'),
('11111111-1111-1111-1111-111111111111', 2, '공무원 국어 회독방',             4, 3, NULL,   '오전 출석 필수',                 FALSE, FALSE, 'https://picsum.photos/seed/study3/400/300',  NOW() - INTERVAL '3 days',  NOW(), NOW() + INTERVAL '50 days'),
('11111111-1111-1111-1111-111111111111', 2, '행정법 기출 스터디',             4, 4, NULL,   '매일 50문제 풀이',               FALSE, FALSE, 'https://picsum.photos/seed/study4/400/300',  NOW() - INTERVAL '4 days',  NOW(), NOW() + INTERVAL '45 days'),
('11111111-1111-1111-1111-111111111111', 1, '토익 LC·RC 900점 목표 (비공개)', 4, 2, '1234', '초대된 멤버만 참여 가능합니다.', TRUE,  FALSE, 'https://picsum.photos/seed/study13/400/300', NOW() - INTERVAL '2 days',  NOW(), NOW() + INTERVAL '45 days'),
-- 이수민 (test2) -------------------------------------------------------
('22222222-2222-2222-2222-222222222222', 3, 'Spring Boot 프로젝트반',         4, 2, NULL,   '매주 기능 구현 공유',            FALSE, FALSE, 'https://picsum.photos/seed/study5/400/300',  NOW() - INTERVAL '5 days',  NOW(), NOW() + INTERVAL '60 days'),
('22222222-2222-2222-2222-222222222222', 3, 'React TypeScript 스터디',        4, 1, NULL,   '컴포넌트 리팩토링 중심',         FALSE, FALSE, 'https://picsum.photos/seed/study6/400/300',  NOW() - INTERVAL '6 days',  NOW(), NOW() + INTERVAL '60 days'),
('22222222-2222-2222-2222-222222222222', 4, 'SQLD 단기 합격반',               4, 2, NULL,   '기출 1회씩 풀이',                FALSE, FALSE, 'https://picsum.photos/seed/study7/400/300',  NOW() - INTERVAL '7 days',  NOW(), NOW() + INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', 4, '정보처리기사 실기반',             4, 3, NULL,   '약술형 정리',                    FALSE, FALSE, 'https://picsum.photos/seed/study8/400/300',  NOW() - INTERVAL '8 days',  NOW(), NOW() + INTERVAL '55 days'),
('22222222-2222-2222-2222-222222222222', 3, '알고리즘 코딩테스트 (비공개)',   4, 3, '9999', '매일 백준 1문제 필수 제출',      TRUE,  FALSE, 'https://picsum.photos/seed/study14/400/300', NOW() - INTERVAL '5 days',  NOW(), NOW() + INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', 4, 'AWS SAA 자격증 (비공개)',         4, 2, '5678', '덤프 풀이 및 오답 공유',         TRUE,  TRUE,  'https://picsum.photos/seed/study15/400/300', NOW() - INTERVAL '3 days',  NOW(), NOW() + INTERVAL '40 days'),
-- 박준영 (test3) -------------------------------------------------------
('33333333-3333-3333-3333-333333333333', 5, '면접 CS 준비방',                 4, 1, NULL,   '하루 3문제 답변',                FALSE, FALSE, 'https://picsum.photos/seed/study9/400/300',  NOW() - INTERVAL '9 days',  NOW(), NOW() + INTERVAL '25 days'),
('33333333-3333-3333-3333-333333333333', 5, '자소서 첨삭 스터디',             4, 2, NULL,   '주 2회 첨삭',                    FALSE, FALSE, 'https://picsum.photos/seed/study10/400/300', NOW() - INTERVAL '11 days', NOW(), NOW() + INTERVAL '20 days'),
('33333333-3333-3333-3333-333333333333', 6, '대학생 시험기간 캠스터디',       4, 3, NULL,   '각자 전공 공부',                 FALSE, FALSE, 'https://picsum.photos/seed/study11/400/300', NOW() - INTERVAL '12 days', NOW(), NOW() + INTERVAL '15 days'),
('33333333-3333-3333-3333-333333333333', 6, '과제 집중방',                    4, 1, NULL,   '카메라 ON 권장',                 FALSE, FALSE, 'https://picsum.photos/seed/study12/400/300', NOW() - INTERVAL '13 days', NOW(), NOW() + INTERVAL '10 days'),
('33333333-3333-3333-3333-333333333333', 5, '포트폴리오 상호 피드백 (비공개)', 4, 4, '2580', '주 1회 발표 필수',               TRUE,  FALSE, 'https://picsum.photos/seed/study16/400/300', NOW() - INTERVAL '7 days',  NOW(), NOW() + INTERVAL '20 days'),
('33333333-3333-3333-3333-333333333333', 6, '졸업논문 작성 스터디 (비공개)',   4, 1, '0000', '논문 작성 진도 공유',            TRUE,  FALSE, 'https://picsum.photos/seed/study17/400/300', NOW() - INTERVAL '10 days', NOW(), NOW() + INTERVAL '60 days');

-- =====================================================================
-- 4. 방문 기록 (10개) — 박준영(test3) 기준 (다른 유저 방 방문 시뮬레이션)
-- =====================================================================
INSERT INTO room_visit_histories (room_no, user_uuid, visit_count, last_visited_at) VALUES
((SELECT room_no FROM rooms WHERE room_title = '정보처리기사 실기반'              LIMIT 1), '33333333-3333-3333-3333-333333333333', 15, NOW() - INTERVAL '5 minutes'),
((SELECT room_no FROM rooms WHERE room_title = '토익 LC·RC 900점 목표 (비공개)'   LIMIT 1), '33333333-3333-3333-3333-333333333333',  6, NOW() - INTERVAL '1 hour'),
((SELECT room_no FROM rooms WHERE room_title = 'React TypeScript 스터디'          LIMIT 1), '33333333-3333-3333-3333-333333333333',  9, NOW() - INTERVAL '3 hours'),
((SELECT room_no FROM rooms WHERE room_title = '알고리즘 코딩테스트 (비공개)'     LIMIT 1), '33333333-3333-3333-3333-333333333333',  5, NOW() - INTERVAL '1 day'),
((SELECT room_no FROM rooms WHERE room_title = 'Spring Boot 프로젝트반'            LIMIT 1), '33333333-3333-3333-3333-333333333333',  8, NOW() - INTERVAL '2 days'),
((SELECT room_no FROM rooms WHERE room_title = '공무원 국어 회독방'                LIMIT 1), '33333333-3333-3333-3333-333333333333', 18, NOW() - INTERVAL '3 days'),
((SELECT room_no FROM rooms WHERE room_title = '대학생 시험기간 캠스터디'          LIMIT 1), '11111111-1111-1111-1111-111111111111',  7, NOW() - INTERVAL '4 days'),
((SELECT room_no FROM rooms WHERE room_title = 'AWS SAA 자격증 (비공개)'           LIMIT 1), '11111111-1111-1111-1111-111111111111', 22, NOW() - INTERVAL '1 week'),
((SELECT room_no FROM rooms WHERE room_title = '자소서 첨삭 스터디'                LIMIT 1), '22222222-2222-2222-2222-222222222222',  3, NOW() - INTERVAL '2 weeks'),
((SELECT room_no FROM rooms WHERE room_title = '토익 900 목표반'                   LIMIT 1), '22222222-2222-2222-2222-222222222222', 12, NOW() - INTERVAL '3 weeks');

-- 1. user_auths에 Google 레코드 있는지, provider_profile_image 값 있는지
SELECT auth_no, user_uuid, provider, provider_profile_image, connected_at 
FROM user_auths 
WHERE provider = 'GOOGLE';

-- 2. users 테이블 상태
SELECT user_uuid, user_email, user_name, user_profile_image, created_at
FROM users
WHERE user_email = 'aya70713@gmail.com';