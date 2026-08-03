# 📚 StudyCast

![StudyCast](docs/portfolio/banner/banner.png)

🔗 **[배포된 서비스 바로가기](https://study-cast-ten.vercel.app/)**

---

## 📌 목차

- [1. 프로젝트 개요](#1-프로젝트-개요)
- [2. 역할 분담](#2-역할-분담)
- [3. 기술 및 도구](#3-기술-및-도구)
- [4. 설계 구조](#4-설계-구조)
  - [기능 정의서](#기능-정의서)
  - [API 정의서](#api-정의서)
  - [ERD](#erd)
  - [사용자 플로우](#사용자-플로우)
  - [화면 설계](#화면-설계)
  - [백엔드 CI/CD 및 AWS 배포 구조](#백엔드-cicd-및-aws-배포-구조)
  - [프로젝트 구조](#프로젝트-구조)

## 1. 프로젝트 개요

'StudyCast' 프로젝트는 실시간 캠 스터디 서비스인 구루미를 참고하여 제작한 온라인 캠 스터디 플랫폼으로, LiveKit 기반 다자간 화상 연결과 WebSocket 기반 실시간 채팅을 제공합니다. 또한 개인 캘린더와 플래너를 통해 출결, 공부 기록, D-Day, 일일 계획 등 개인 학습 기록을 관리할 수 있습니다.

기존 CRUD 중심 프로젝트에서 확장하여 실시간 통신, 외부 서비스 연동, 인증·인가와 실제 배포 과정을 경험하는 것을 목표로 진행했습니다. 또한 기능 구현과 테스트·검증 과정에서 Claude Code를 보조 도구로 활용했습니다.

## 2. 역할 분담

| 담당자 | 기획∙설계 역할 | 담당 기능 및 배포 |
|---|---|---|
| 안영아 | - 기능 정의 구체화<br>- 화면 설계 | 1. JWT 기반 인증・인가 및 소셜 로그인 통합<br>2. 회원가입・로그인 페이지<br>3. 메인 페이지<br>4. LiveKit 기반 실시간 캠 스터디<br>5. 스터디방 생성 페이지<br>6. 방문한 방 페이지<br>7. GitHub Actions 기반 AWS EC2 백엔드 자동 배포 |
| 박희진 | - 기능 정의서 초안 작성<br>- ERD 및 DB 설계 | 1. WebSocket 기반 실시간 채팅<br>2. 공부 시간 측정 및 기록<br>3. 스터디방 멤버 관리/캘린더・플래너/공지사항/설정<br>4. 내 프로필 페이지<br>5. 내 스터디 페이지<br>6. Vercel 프론트엔드 배포 |

## 3. 기술 및 도구

![기술 스택](docs/portfolio/skill-tools/skill-tools.png)

## 4. 설계 구조 <sub>(펼쳐보기)</sub>

<details>
<summary><h3>기능 정의서</h3></summary>

![기능 정의서](docs/portfolio/spec/feature-spec-1.png)
![기능 정의서](docs/portfolio/spec/feature-spec-2.png)
![기능 정의서](docs/portfolio/spec/feature-spec-3.png)

</details>

<details>
<summary><h3>API 정의서</h3></summary>

![API 정의서](docs/portfolio/spec/api-spec-1.png)
![API 정의서](docs/portfolio/spec/api-spec-2.png)

</details>

<details>
<summary><h3>ERD</h3></summary>

![ERD](docs/portfolio/erd/erd.png)

</details>

<details>
<summary><h3>사용자 플로우</h3></summary>

### 회원가입

<img src="docs/portfolio/flows/auth-signup-flow.png" alt="회원가입 플로우" width="400">

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 로그인

<img src="docs/portfolio/flows/auth-login-flow.png" alt="로그인 플로우" width="600">

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 비밀번호 재설정

<img src="docs/portfolio/flows/password-reset-flow.png" alt="비밀번호 재설정 플로우" width="400">

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 스터디방 생성

<img src="docs/portfolio/flows/room-create-flow.png" alt="스터디방 생성 플로우" width="600">

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 스터디방 입장

<img src="docs/portfolio/flows/room-join-flow.png" alt="스터디방 입장 플로우" width="400">

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 스터디방 이용

<img src="docs/portfolio/flows/live-study-flow.png" alt="스터디방 이용 플로우" width="600">

</details>

<details>
<summary><h3>화면 설계</h3></summary>

### 메인페이지

![메인페이지](docs/portfolio/screen-design/mainpage.png)

### 메인페이지 - 입장

![메인페이지 - 입장](docs/portfolio/screen-design/mainpage-modal.png)

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 스터디방 생성 페이지

![스터디방 생성 페이지](docs/portfolio/screen-design/roomcreate.png)

### 스터디방 생성 페이지 - 확인

![스터디방 생성 페이지 - 확인](docs/portfolio/screen-design/roomcreate-confirm.png)

### 스터디방 생성 페이지 - 초기화

![스터디방 생성 페이지 - 초기화](docs/portfolio/screen-design/roomcreate-reset.png)

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 실시간 스터디방 페이지

![실시간 스터디방 페이지](docs/portfolio/screen-design/studyroom.png)

### 실시간 스터디방 페이지 - 멤버 관리

![실시간 스터디방 페이지 - 멤버 관리](docs/portfolio/screen-design/studyroom-members.png)

### 실시간 스터디방 페이지 - 캘린더/플래너

![실시간 스터디방 페이지 - 캘린더/플래너](docs/portfolio/screen-design/studyroom-calendar.png)
![실시간 스터디방 페이지 - 캘린더/플래너](docs/portfolio/screen-design/studyroom-planner.png)

### 실시간 스터디방 페이지 - 공지사항

![실시간 스터디방 페이지 - 공지사항](docs/portfolio/screen-design/studyroom-notice.png)

### 실시간 스터디방 페이지 - 설정

![실시간 스터디방 페이지 - 설정](docs/portfolio/screen-design/studyroom-settings.png)

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 내 프로필 페이지

![내 프로필 페이지](docs/portfolio/screen-design/profile.png)

### 내 프로필 페이지 - 비밀번호 변경

![내 프로필 페이지 - 비밀번호 변경](docs/portfolio/screen-design/profile-password.png)

### 내 프로필 페이지 - 탈퇴

![내 프로필 페이지 - 탈퇴](docs/portfolio/screen-design/profile-withdraw.png)

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 내 스터디 페이지

![내 스터디 페이지](docs/portfolio/screen-design/mystudy.png)

### 내 스터디 페이지 - 삭제

![내 스터디 페이지 - 삭제](docs/portfolio/screen-design/mystudy-delete.png)

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 방문한 방 페이지

![방문한 방 페이지](docs/portfolio/screen-design/visited.png)

<img src="docs/portfolio/assets/divider.png" width="100%" height="1">

### 검색 결과 페이지

![검색 결과 페이지](docs/portfolio/screen-design/search.png)

</details>

<details>
<summary><h3>백엔드 CI/CD 및 AWS 배포 구조</h3></summary>

<img src="docs/portfolio/cicd/cicd-deploy-architecture-flow.png" alt="백엔드 CI/CD 및 AWS 배포 구조" width="400">

</details>

<details>
<summary><h3>프로젝트 구조</h3></summary>

#### 전체 프로젝트 축약 트리

```
Study-cast/
├── studycastApp/                     # React 프론트엔드(Vite + TypeScript)
├── studycast/                        # Spring Boot 백엔드(Java 23, Gradle)
├── docs/deliverables/                # 설계·포트폴리오 산출물(기능 정의서, API 명세서, ERD, 사용자 플로우, 구조도)
├── .github/workflows/                # GitHub Actions CI/CD
├── docker-compose.aws-ec2.yml        # EC2 운영 배포용 Docker Compose 정의
└── deploy-update.sh                  # EC2 배포 스크립트
```

#### 프론트엔드 핵심 구조 (`studycastApp/src`)

```
src/
├── pages/                            # 화면 단위 페이지
│   ├── StudyRoomPage/                 # 캠 스터디 화면(화상·채팅·타이머)
│   └── RoomCreatePage/                # 스터디방 생성 화면
├── components/ui/
│   └── Modal.tsx                     # 공용 모달 등 UI 컴포넌트
├── services/                         # REST API · 실시간 통신 클라이언트
│   ├── apiClient.ts                  # Axios 공통 설정, 토큰 처리
│   └── studyRoomService.ts           # WebSocket/STOMP 연결, LiveKit 토큰 호출
├── hooks/
│   └── useLiveKit.ts                 # LiveKit 화상 연결 관리
├── contexts/
│   └── AuthContext.tsx               # 로그인 인증 상태 관리
├── routes/
│   └── router.tsx                    # 페이지 라우팅
├── types/
│   └── room.ts                       # 공통 타입 정의
└── utils/
    └── validators.ts                 # 공통 유틸 함수
```

#### 백엔드 핵심 구조 (`studycast/src/main/java/com/younghee/studycast`)

```
com/younghee/studycast/
├── controller/                       # REST 엔드포인트 + STOMP 메시지 핸들러
│   ├── AuthController.java            # 인증 REST
│   ├── RoomController.java            # 스터디방 REST · LiveKit 토큰 발급
│   ├── ChatController.java            # 채팅 STOMP
│   ├── TimerController.java           # 타이머 STOMP
│   └── StudyLogController.java        # 공부시간 REST
├── service/
│   ├── RoomServiceImpl.java           # 스터디방 비즈니스 로직
│   └── LiveKitTokenServiceImpl.java   # LiveKit 접속 JWT 자체 발급
├── dao/
│   └── RoomsMapper.java               # MyBatis Mapper 인터페이스
├── dto/
│   └── RoomsDTO.java                  # 계층 간 데이터 객체
├── config/
│   ├── SecurityConfig.java            # Spring Security 필터 체인
│   └── WebSocketAuthChannelInterceptor.java  # STOMP 인증 처리
├── security/
│   └── JwtProvider.java               # JWT 생성 · 검증
├── oauth/
│   └── CustomOAuth2UserService.java   # 소셜 로그인 처리
├── scheduler/
│   └── WithdrawnUserCleanupScheduler.java  # 탈퇴 계정 정리 배치
├── handler/
│   └── GlobalExceptionHandler.java    # 전역 예외 처리
└── util/
    └── AuthCookieUtil.java            # 인증 쿠키 유틸

resources/mybatis/mapper/
└── RoomsMapper.xml                    # MyBatis SQL 정의
```

</details>
