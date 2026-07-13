# Study-cast

<img src="https://github.com/user-attachments/assets/c83efd8b-cfb3-4fcd-8e3f-4d4a5960143c" />
실시간 화상·채팅으로 함께 공부하는 온라인 스터디룸 서비스입니다.
<br>
🔗 **배포 주소**: https://study-cast-ten.vercel.app

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [프로젝트 구조](#프로젝트-구조)
3. [팀 구성 및 역할](#팀-구성-및-역할)
4. [기술 스택](#기술-스택)
5. [아키텍처](#아키텍처)
6. [프로젝트 수행 경과](#프로젝트-수행-경과)
7. [화면 설계서](#화면-설계서)

---

## 프로젝트 개요

### 프로젝트 주제

혼자보다 함께일 때 더 오래 집중할 수 있다는 아이디어에서 출발한, **실시간 화상/음성·채팅 기반 온라인 스터디룸 서비스**입니다. 원하는 주제의 스터디룸을 만들거나 찾아 들어가면, 서로의 얼굴을 보며 공부하고 실시간으로 소통하면서 각자의 공부 시간이 자동으로 기록됩니다.

### 주제 선정 배경

비대면 학습 환경이 익숙해지면서 유튜브 "캠 스터디(스터디윗미)" 영상이나 화상 스터디 서비스를 이용해 타인과 공부 공간을 공유하며 집중력을 유지하려는 수요가 늘고 있습니다. 그러나 기존 서비스들은 결제 유도가 잦거나 기능이 지나치게 복잡한 경우가 많아 회원가입 후 바로 화상 스터디룸에 입장해 공부에만 집중할 수 있는 가볍고 직관적인 서비스가 필요하다고 판단했습니다.

### 기획 의도

- 방을 만들고 입장하는 과정을 최소한의 단계로 단순화
- 화상/음성 + 채팅 + 공부 시간 기록을 하나의 서비스 안에서 끊김 없이 제공
- 스터디룸 안에서의 몰입을 방해하지 않는 담백한 UI

---

## 프로젝트 구조

### 주요 기능

**스터디룸**
- 방 생성(정원, 카테고리, 공개/비공개+참여코드, 공지, 썸네일)
- 실시간 화상/음성 (LiveKit)
- 실시간 채팅 & 멤버 입퇴장 알림 (WebSocket/STOMP)
- 방장 권한 — 멤버 추방, 이메일 초대, 공지 관리

**공부 기록 & 계획**
- 스터디룸 입장 기반 누적 공부 시간 자동 트래킹
- 주간 학습 플래너
- D-day 관리

**계정**
- 이메일 회원가입/로그인(JWT) + Google · Kakao 소셜 로그인
- 이메일 인증번호 기반 비밀번호 찾기
- 프로필 관리(닉네임, 관심 카테고리, 프로필 이미지)

**탐색**
- 스터디룸 검색·필터링·추천(비로그인 게스트 추천 포함)
- 내가 만든/참여한 스터디 모아보기, 방문 기록

### 메뉴 구조도

```
Study-cast
├─ 메인 ( / )
│   ├─ 스터디룸 탐색·검색·필터
│   ├─ 추천 스터디룸
│   └─ 대시보드(내 공부 요약)
├─ 로그인 ( /login ) · 회원가입 ( /signup )
│   ├─ 이메일 로그인/가입
│   ├─ Google · Kakao 소셜 로그인
│   └─ 비밀번호 찾기
├─ 스터디룸 생성 ( /rooms/new )
├─ 스터디룸 ( /rooms/:roomId )
│   ├─ 화상/음성
│   ├─ 실시간 채팅
│   ├─ 멤버 목록 / 공지
│   └─ 캘린더·플래너 (D-day, 주간 플래너)
├─ 마이페이지 ( /profile )
│   ├─ 프로필 수정
│   ├─ 비밀번호 변경 / 소셜 계정 연동
│   └─ 회원 탈퇴
├─ 내 스터디 ( /my-study )
└─ 방문한 방 ( /visited-rooms )
```

---

## 팀 구성 및 역할

| 이름 | 역할 | 담당 업무 |
|---|---|---|
| **박희진** | Backend / Frontend | DB 설계 및 ERD 작성 · 채팅 기능(WebSocket/STOMP) · 마이페이지 · 캘린더(주간 플래너) 기능 |
| **안영아** | Backend / Frontend | UI설계 · 회원가입·로그인 및 인증(JWT, Google·Kakao 소셜 로그인, 보안) · 스터디룸 생성 · 메인페이지 · 배포/인프라 |

---

## 기술 스택

### Frontend
<div align="left">
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white">
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white">
  <img src="https://img.shields.io/badge/STOMP.js-010101?style=for-the-badge">
</div>

### Backend
<div align="left">
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white">
  <img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white">
  <img src="https://img.shields.io/badge/OAuth_2.0-EB5424?style=for-the-badge&logo=auth0&logoColor=white">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
  <img src="https://img.shields.io/badge/MyBatis-000000?style=for-the-badge">
  <img src="https://img.shields.io/badge/Lombok-DC382D?style=for-the-badge">
  <img src="https://img.shields.io/badge/WebSocket_(STOMP)-010101?style=for-the-badge">
</div>

### Database
<div align="left">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
</div>

### API / Service
<div align="left">
  <img src="https://img.shields.io/badge/LiveKit-0B0D17?style=for-the-badge">
  <img src="https://img.shields.io/badge/Kakao_Login-FEE500?style=for-the-badge&logo=kakao&logoColor=000000">
  <img src="https://img.shields.io/badge/Google_Login-4285F4?style=for-the-badge&logo=google&logoColor=white">
</div>

### Infra / Tools
<div align="left">
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white">
  <img src="https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white">
  <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
</div>

---

## 프로젝트 수행 경과

### 요구사항 정의서

<!-- TODO: 문서 링크 연결 -->
- [요구사항 정의서](#)

### ERD

<!-- TODO: ERD 이미지를 docs/images/erd.png 로 추가한 뒤 아래 경로를 연결해주세요. 원본 테이블 정의는 studycast/SQL/DDL.sql 참고 -->
![ERD](docs/images/erd.png)

주요 테이블: `users`, `user_auths`(소셜 연동), `roles`, `user_interests`, `rooms`, `room_participants`, `room_visit_histories`, `chats`, `study_logs`, `study_sessions`, `ddays`, `week_plans`, `refresh_tokens`, `email_verifications`, `categories`

---

## 화면 설계서

<!-- TODO: 문서 링크 연결 -->
- [화면 설계서 / 와이어프레임](#)
