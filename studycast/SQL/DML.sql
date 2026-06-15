-- Active: 1779245779408@@localhost@5432@studycast_db@public

-- =====================================================================
-- 1. 카테고리
-- =====================================================================
INSERT INTO categories (category_no, category_name) VALUES
(1, '어학'),
(2, '공무원'),
(3, '개발·IT'),
(4, '자격증'),
(5, '취업·면접'),
(6, '대학생');

-- =====================================================================
-- 2. 스터디방 (공개 12 + 비공개 5)
--    now_users: 방 상세 페이지 UI 테스트용 임의값 (운영에서는 입장/퇴장 시 서버가 관리)
-- =====================================================================
INSERT INTO rooms (
    user_uuid, category_no, room_title,
    max_users, now_users, room_password, room_notice,
    room_private, room_premium, room_thumbnail,
    created_at, updated_at, expired_at
) VALUES
-- 공개 방
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 1, '토익 900 목표반',              4, 2, NULL,   '매일 단어 인증합니다.',          FALSE, FALSE, 'https://picsum.photos/seed/study1/400/300',  NOW() - INTERVAL '1 day',   NOW(), NOW() + INTERVAL '40 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 1, '오픽 AL 준비방',               4, 1, NULL,   '저녁마다 말하기 연습',           FALSE, FALSE, 'https://picsum.photos/seed/study2/400/300',  NOW() - INTERVAL '2 days',  NOW(), NOW() + INTERVAL '35 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 2, '공무원 국어 회독방',            4, 3, NULL,   '오전 출석 필수',                 FALSE, FALSE, 'https://picsum.photos/seed/study3/400/300',  NOW() - INTERVAL '3 days',  NOW(), NOW() + INTERVAL '50 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 2, '행정법 기출 스터디',            4, 4, NULL,   '매일 50문제 풀이',               FALSE, FALSE, 'https://picsum.photos/seed/study4/400/300',  NOW() - INTERVAL '4 days',  NOW(), NOW() + INTERVAL '45 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 3, 'Spring Boot 프로젝트반',        4, 2, NULL,   '매주 기능 구현 공유',            FALSE, FALSE, 'https://picsum.photos/seed/study5/400/300',  NOW() - INTERVAL '5 days',  NOW(), NOW() + INTERVAL '60 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 3, 'React TypeScript 스터디',       4, 1, NULL,   '컴포넌트 리팩토링 중심',         FALSE, FALSE, 'https://picsum.photos/seed/study6/400/300',  NOW() - INTERVAL '6 days',  NOW(), NOW() + INTERVAL '60 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 4, 'SQLD 단기 합격반',              4, 2, NULL,   '기출 1회씩 풀이',                FALSE, FALSE, 'https://picsum.photos/seed/study7/400/300',  NOW() - INTERVAL '7 days',  NOW(), NOW() + INTERVAL '30 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 4, '정보처리기사 실기반',            4, 3, NULL,   '약술형 정리',                    FALSE, FALSE, 'https://picsum.photos/seed/study8/400/300',  NOW() - INTERVAL '8 days',  NOW(), NOW() + INTERVAL '55 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 5, '면접 CS 준비방',                4, 1, NULL,   '하루 3문제 답변',                FALSE, FALSE, 'https://picsum.photos/seed/study9/400/300',  NOW() - INTERVAL '9 days',  NOW(), NOW() + INTERVAL '25 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 5, '자소서 첨삭 스터디',            4, 2, NULL,   '주 2회 첨삭',                    FALSE, FALSE, 'https://picsum.photos/seed/study10/400/300', NOW() - INTERVAL '11 days', NOW(), NOW() + INTERVAL '20 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 6, '대학생 시험기간 캠스터디',      4, 3, NULL,   '각자 전공 공부',                 FALSE, FALSE, 'https://picsum.photos/seed/study11/400/300', NOW() - INTERVAL '12 days', NOW(), NOW() + INTERVAL '15 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 6, '과제 집중방',                   4, 1, NULL,   '카메라 ON 권장',                 FALSE, FALSE, 'https://picsum.photos/seed/study12/400/300', NOW() - INTERVAL '13 days', NOW(), NOW() + INTERVAL '10 days'),
-- 비공개 방
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 1, '토익 LC·RC 900점 목표 (비공개)',  4, 2, '1234', '초대된 멤버만 참여 가능합니다.', TRUE, FALSE, 'https://picsum.photos/seed/study13/400/300', NOW() - INTERVAL '2 days',  NOW(), NOW() + INTERVAL '45 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 3, '알고리즘 코딩테스트 (비공개)',    4, 3, '9999', '매일 백준 1문제 필수 제출',      TRUE, FALSE, 'https://picsum.photos/seed/study14/400/300', NOW() - INTERVAL '5 days',  NOW(), NOW() + INTERVAL '30 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 4, 'AWS SAA 자격증 (비공개)',         4, 2, '5678', '덤프 풀이 및 오답 공유',         TRUE, TRUE,  'https://picsum.photos/seed/study15/400/300', NOW() - INTERVAL '3 days',  NOW(), NOW() + INTERVAL '40 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 5, '포트폴리오 상호 피드백 (비공개)', 4, 4, '2580', '주 1회 발표 필수',               TRUE, FALSE, 'https://picsum.photos/seed/study16/400/300', NOW() - INTERVAL '7 days',  NOW(), NOW() + INTERVAL '20 days'),
((SELECT user_uuid FROM users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1), 6, '졸업논문 작성 스터디 (비공개)',   4, 1, '0000', '논문 작성 진도 공유',            TRUE, FALSE, 'https://picsum.photos/seed/study17/400/300', NOW() - INTERVAL '10 days', NOW(), NOW() + INTERVAL '60 days');

-- =====================================================================
-- 3. 방문 기록 (10개)
-- =====================================================================
INSERT INTO room_visit_histories (room_no, user_uuid, visit_count, last_visited_at) VALUES
((SELECT room_no FROM rooms WHERE room_title = '정보처리기사 실기반'              LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1), 15, NOW() - INTERVAL '5 minutes'),
((SELECT room_no FROM rooms WHERE room_title = '토익 LC·RC 900점 목표 (비공개)'   LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),  6, NOW() - INTERVAL '1 hour'),
((SELECT room_no FROM rooms WHERE room_title = 'React TypeScript 스터디'          LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),  9, NOW() - INTERVAL '3 hours'),
((SELECT room_no FROM rooms WHERE room_title = '알고리즘 코딩테스트 (비공개)'     LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),  5, NOW() - INTERVAL '1 day'),
((SELECT room_no FROM rooms WHERE room_title = 'Spring Boot 프로젝트반'            LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),  8, NOW() - INTERVAL '2 days'),
((SELECT room_no FROM rooms WHERE room_title = '공무원 국어 회독방'                LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1), 18, NOW() - INTERVAL '3 days'),
((SELECT room_no FROM rooms WHERE room_title = '대학생 시험기간 캠스터디'          LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),  7, NOW() - INTERVAL '4 days'),
((SELECT room_no FROM rooms WHERE room_title = 'AWS SAA 자격증 (비공개)'           LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1), 22, NOW() - INTERVAL '1 week'),
((SELECT room_no FROM rooms WHERE room_title = '자소서 첨삭 스터디'                LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),  3, NOW() - INTERVAL '2 weeks'),
((SELECT room_no FROM rooms WHERE room_title = '토익 900 목표반'                   LIMIT 1), (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1), 12, NOW() - INTERVAL '3 weeks');

-- =====================================================================
-- 4. 참여자 데이터 없음
--    now_users는 rooms INSERT에 설정된 테스트값을 그대로 사용
--    실제 참여/퇴장 시 서버(syncNowUsersByActiveParticipants)가 관리
-- =====================================================================
