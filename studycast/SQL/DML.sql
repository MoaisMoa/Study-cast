-- 2-1. 카테고리 기본
INSERT INTO categories (category_no, category_name) VALUES
(1, '어학'),
(2, '공무원'),
(3, '개발·IT'),
(4, '자격증'),
(5, '취업·면접'),
(6, '대학생');

INSERT INTO rooms (
    user_uuid,
    category_no,
    room_title,
    max_users,
    now_users,
    room_password,
    room_notice,
    room_private,
    room_premium,
    room_thumbnail,
    created_at,
    updated_at,
    expired_at
)
VALUES
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    1,
    '토익 900 목표반',
    4,
    2,
    NULL,
    '매일 단어 인증합니다.',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&q=75',
    NOW() - INTERVAL '1 day',
    NOW(),
    NOW() + INTERVAL '40 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    1,
    '오픽 AL 준비방',
    4,
    1,
    NULL,
    '저녁마다 말하기 연습',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=75',
    NOW() - INTERVAL '2 days',
    NOW(),
    NOW() + INTERVAL '35 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    2,
    '공무원 국어 회독방',
    4,
    3,
    NULL,
    '오전 출석 필수',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=75',
    NOW() - INTERVAL '3 days',
    NOW(),
    NOW() + INTERVAL '50 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    2,
    '행정법 기출 스터디',
    4,
    4,
    NULL,
    '매일 50문제 풀이',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=75',
    NOW() - INTERVAL '4 days',
    NOW(),
    NOW() + INTERVAL '45 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    3,
    'Spring Boot 프로젝트반',
    4,
    2,
    NULL,
    '매주 기능 구현 공유',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=75',
    NOW() - INTERVAL '5 days',
    NOW(),
    NOW() + INTERVAL '60 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    3,
    'React TypeScript 스터디',
    4,
    1,
    NULL,
    '컴포넌트 리팩토링 중심',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400&q=75',
    NOW() - INTERVAL '6 days',
    NOW(),
    NOW() + INTERVAL '60 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    4,
    'SQLD 단기 합격반',
    4,
    2,
    NULL,
    '기출 1회씩 풀이',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=75',
    NOW() - INTERVAL '7 days',
    NOW(),
    NOW() + INTERVAL '30 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    4,
    '정보처리기사 실기반',
    4,
    3,
    NULL,
    '약술형 정리',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=400&q=75',
    NOW() - INTERVAL '8 days',
    NOW(),
    NOW() + INTERVAL '55 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    5,
    '면접 CS 준비방',
    4,
    1,
    NULL,
    '하루 3문제 답변',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&q=75',
    NOW() - INTERVAL '9 days',
    NOW(),
    NOW() + INTERVAL '25 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    5,
    '자소서 첨삭 스터디',
    4,
    2,
    NULL,
    '주 2회 첨삭',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=75',
    NOW() - INTERVAL '11 days',
    NOW(),
    NOW() + INTERVAL '20 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    6,
    '대학생 시험기간 캠스터디',
    4,
    3,
    NULL,
    '각자 전공 공부',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&q=75',
    NOW() - INTERVAL '12 days',
    NOW(),
    NOW() + INTERVAL '15 days'
),
(
    (SELECT user_uuid FROM users WHERE deleted_at IS NULL LIMIT 1),
    6,
    '과제 집중방',
    4,
    1,
    NULL,
    '카메라 ON 권장',
    FALSE,
    FALSE,
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=75',
    NOW() - INTERVAL '13 days',
    NOW(),
    NOW() + INTERVAL '10 days'
);

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study1/400/300'
WHERE room_title = '토익 900 목표반';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study2/400/300'
WHERE room_title = '오픽 AL 준비방';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study3/400/300'
WHERE room_title = '공무원 국어 회독방';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study4/400/300'
WHERE room_title = '행정법 기출 스터디';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study5/400/300'
WHERE room_title = 'Spring Boot 프로젝트반';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study6/400/300'
WHERE room_title = 'React TypeScript 스터디';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study7/400/300'
WHERE room_title = 'SQLD 단기 합격반';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study8/400/300'
WHERE room_title = '정보처리기사 실기반';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study9/400/300'
WHERE room_title = '면접 CS 준비방';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study10/400/300'
WHERE room_title = '자소서 첨삭 스터디';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study11/400/300'
WHERE room_title = '대학생 시험기간 캠스터디';

UPDATE rooms
SET room_thumbnail = 'https://picsum.photos/seed/study12/400/300'
WHERE room_title = '과제 집중방';