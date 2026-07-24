# StudyCast 프로젝트 구조 (포트폴리오 요약)

React 프론트엔드와 Spring Boot 백엔드가 REST API와 WebSocket/STOMP로 통신하고, 화상은 LiveKit에 직접 연결하는 실시간 스터디 서비스의 폴더·파일 구조 요약이다.

## 전체 프로젝트 축약 트리

```
Study-cast/
├── studycastApp/                     # React 프론트엔드(Vite + TypeScript)
├── studycast/                        # Spring Boot 백엔드(Java 23, Gradle)
├── docs/deliverables/                # 설계·포트폴리오 산출물(기능 정의서, API 명세서, ERD, 사용자 플로우, 구조도)
├── .github/workflows/                # GitHub Actions CI/CD
├── docker-compose.aws-ec2.yml        # EC2 운영 배포용 Docker Compose 정의
└── deploy-update.sh                  # EC2 배포 스크립트
```

## 프론트엔드 핵심 구조 (`studycastApp/src`)

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

## 백엔드 핵심 구조 (`studycast/src/main/java/com/younghee/studycast`)

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

## 주요 요청 처리 흐름

**일반 REST(스터디방 생성)**
```
RoomCreatePage.tsx
 → roomService.ts (createRoom)
  → RoomController.java (POST /api/rooms)
   → RoomServiceImpl.java
    → RoomsMapper.java + RoomsMapper.xml
     → PostgreSQL (rooms)
```

**WebSocket/STOMP — 채팅**
```
studyRoomService.ts (STOMP 클라이언트)
 → ChatController.java
  → ChatsServiceImpl.java
   → ChatsMapper.java (INSERT INTO chats)
    → 같은 방 참여자에게 실시간 브로드캐스트
```

**WebSocket/STOMP — 타이머**
```
studyRoomService.ts (STOMP 클라이언트)
 → TimerController.java
  → DB 저장 없이 바로 브로드캐스트
```

**실제 공부시간(별도 REST — 타이머 브로드캐스트와 다른 경로)**
```
StudyRoomPage.tsx
 → studyRoomService.ts (accumulateStudySeconds, REST)
  → StudyLogController.java (POST /api/study-logs/accumulate)
   ├→ StudyLogService.java → StudyLogMapper.java + StudyLogMapper.xml → PostgreSQL (study_logs)
   └→ RoomParticipantsMapper.java(Service 경유 없이 직접 호출) + RoomParticipantsMapper.xml → PostgreSQL (room_participants)
```

**LiveKit**
```
useLiveKit.ts
 → studyRoomService.ts (fetchLiveKitToken, REST)
  → RoomController.java (GET /api/rooms/{roomNo}/token)
   → LiveKitTokenServiceImpl.java (LiveKit Server SDK로 접속 JWT 자체 발급)
    → 브라우저가 응답받은 URL로 LiveKit 서버에 직접 연결(WebRTC, Spring Boot 미경유)
```

## 구조 설명 요약

- 프론트는 화면(`pages/`)과 API/실시간 통신(`services/`)이 분리되어 있고, REST는 `apiClient.ts`, WebSocket은 `studyRoomService.ts`가 각각 담당한다.
- 백엔드는 대체로 `controller → service → dao(Mapper) → MyBatis XML → PostgreSQL`로 이어지는 계층 구조를 따르며, 공부시간 저장(`room_participants` 갱신)처럼 일부 경로는 Controller가 Mapper를 Service 경유 없이 직접 호출하기도 한다.
- 같은 실시간 기능이라도 채팅은 STOMP 처리 중 DB에 저장되고, 타이머는 화면 공유 전용으로 DB에 저장되지 않으며, 실제 공부시간은 이 둘과 별개인 REST API로 저장된다 — 세 경로를 같은 흐름으로 혼동하지 않아야 한다.
- LiveKit은 백엔드가 접속 토큰만 발급하고, 실제 영상·음성 연결은 브라우저와 LiveKit 서버 간 직접 연결(WebRTC)이라 Spring Boot를 거치지 않는다.
- 배포·인프라 상세 구조는 본 프로젝트 구조도에서 제외하고, 프론트엔드와 백엔드의 코드 구성 및 요청 처리 계층을 중심으로 정리했다.
