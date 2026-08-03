# 📚 StudyCast

🔗 **[배포된 서비스 바로가기](https://study-cast-ten.vercel.app/)** ・ 📖 **[Notion 상세 포트폴리오 바로가기](https://hello0a.notion.site/StudyCast-AWS-39bbff13bc7980058317c0b65b1883b8)**

---

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [프로젝트 기본 정보](#프로젝트-기본-정보)
- [역할 분담](#역할-분담)
- [기술 및 도구](#기술-및-도구)
- [설계 구조](#설계-구조)
  - [기능 정의서](#기능-정의서)
  - [API 정의서](#api-정의서)
  - [ERD](#erd)
  - [사용자 플로우](#사용자-플로우)
  - [화면 설계](#화면-설계)
  - [백엔드 CI/CD 및 AWS 배포 구조](#백엔드-cicd-및-aws-배포-구조)
  - [프로젝트 디렉터리 구조](#프로젝트-디렉터리-구조)
- [Notion 상세 포트폴리오](#-notion-상세-포트폴리오)

---

## 프로젝트 개요

'StudyCast' 프로젝트는 실시간 캠 스터디 서비스인 구루미를 참고하여 제작한 온라인 캠 스터디 플랫폼으로, LiveKit 기반 다자간 화상 연결과 WebSocket 기반 실시간 채팅을 제공합니다. 또한 개인 캘린더와 플래너를 통해 출결, 공부 기록, D-Day, 일일 계획 등 개인 학습 기록을 관리할 수 있습니다.

기존 CRUD 중심 프로젝트에서 확장하여 실시간 통신, 외부 서비스 연동, 인증·인가와 실제 배포 과정을 경험하는 것을 목표로 진행했습니다. 또한 기능 구현과 테스트·검증 과정에서 Claude Code를 보조 도구로 활용했습니다.

## 프로젝트 기본 정보

- 개발 인원: 2명
- 개발 기간: 2026/05/26 → 2026/07/01
- GitHub: https://github.com/hello0a/Study-cast
- 배포: https://study-cast-ten.vercel.app/

## 역할 분담

| 담당자 | 기획∙설계 역할 | 담당 기능 및 배포 |
|---|---|---|
| 안영아 | 기능 정의 구체화<br>화면 설계 | 1. JWT 기반 인증・인가 및 소셜 로그인 통합<br>2. 회원가입・로그인 페이지<br>3. 메인 페이지<br>4. LiveKit 기반 실시간 캠 스터디<br>5. 스터디방 생성 페이지<br>6. 방문한 방 페이지<br>7. GitHub Actions 기반 AWS EC2 백엔드 자동 배포 |
| 박희진 | 기능 정의서 초안 작성<br>ERD 및 DB 설계 | 1. WebSocket 기반 실시간 채팅<br>2. 공부 시간 측정 및 기록<br>3. 스터디방 멤버 관리/캘린더・플래너/공지사항/설정<br>4. 내 프로필 페이지<br>5. 내 스터디 페이지<br>6. Vercel 프론트엔드 배포 |

## 기술 및 도구

<p>
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Java-007396?style=flat-square&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/MyBatis-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=flat-square&logo=websocket&logoColor=white" />
  <img src="https://img.shields.io/badge/LiveKit-FF3D57?style=flat-square&logo=livekit&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=flat-square&logo=amazonec2&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/ChatGPT-412991?style=flat-square&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude_Code-D97757?style=flat-square&logo=anthropic&logoColor=white" />
</p>

<details>
<summary>기술 스택 상세 이미지 보기</summary>

![기술 스택](docs/portfolio/skill-tools/skill-tools.png)

</details>

- **LiveKit**: 다자간 영상·음성 기능을 구현하기 위해 직접 WebRTC 서버를 구축하는 대신, WebRTC 기반 오픈소스 플랫폼인 LiveKit을 선택했습니다. 관리형 서비스 LiveKit Cloud를 사용하여 백엔드의 접속 토큰 발급과 프론트엔드의 미디어 트랙 제어를 분리했습니다.
- **WebSocket·STOMP**: 같은 스터디방의 사용자들이 실시간 채팅, 멤버 입/퇴장 알림, 공부 타이머 상태를 공유할 수 있도록 WebSocket 기반 STOMP를 사용했습니다. 방별 구독 경로를 분리하고, CONNECT 단계에서 사용자 인증을 확인한 뒤 SUBSCRIBE 단계에서 방 접근 권한을 검증하여 해당 스터디방의 사용자에게만 메시지가 전달되도록 구성했습니다.
- **TypeScript**: 화면 설계 시안을 프로젝트에 통합하는 과정에서 타입 안정성을 확보할 수 있는 TypeScript로 변환했습니다. API 응답 데이터와 컴포넌트 속성 구조를 명시하고, 사용자·스터디방·개인 학습 등 데이터의 인터페이스와 서비스 응답 타입을 정의하는 데 적용했습니다.
- **PostgreSQL**: 회원·스터디방·참여자·방문 기록·공부 기록처럼 서로 관계가 있는 데이터를 저장하기 위해 PostgreSQL을 사용했습니다. UUID 기본값 생성과 CHECK 제약조건 등 DB에서도 데이터 형식을 검증하도록 구성했으며, MyBatis를 통해 SQL을 직접 작성·관리하는 방식으로 접근했습니다.
- **AWS EC2·Docker·GitHub Actions**: 로컬 실행에 그치지 않고 실제 운영 환경과 자동 배포 과정을 경험하기 위해 AWS EC2, Docker, GitHub Actions를 적용했습니다. GitHub Actions에서 백엔드와 Docker 이미지를 빌드하고, AWS 서비스를 거쳐 EC2의 Docker 컨테이너를 자동 갱신하는 CI/CD 환경을 구성했습니다.

## 설계 구조

### 기능 정의서

<details>
<summary>이미지 보기</summary>

![기능 정의서](docs/portfolio/spec/feature-spec-1.png)
![기능 정의서](docs/portfolio/spec/feature-spec-2.png)
![기능 정의서](docs/portfolio/spec/feature-spec-3.png)

</details>

### API 정의서

<details>
<summary>이미지 보기</summary>

![API 정의서](docs/portfolio/spec/api-spec-1.png)
![API 정의서](docs/portfolio/spec/api-spec-2.png)

</details>

### ERD

<details>
<summary>이미지 보기</summary>

![ERD](docs/portfolio/erd/erd.png)

</details>

### 사용자 플로우

<details>
<summary>이미지 보기</summary>

#### 회원가입

![회원가입 플로우](docs/portfolio/flows/auth-signup-flow.png)

#### 로그인

![로그인 플로우](docs/portfolio/flows/auth-login-flow.png)

#### 비밀번호 재설정

![비밀번호 재설정 플로우](docs/portfolio/flows/password-reset-flow.png)

#### 스터디방 생성

![스터디방 생성 플로우](docs/portfolio/flows/room-create-flow.png)

#### 스터디방 입장

![스터디방 입장 플로우](docs/portfolio/flows/room-join-flow.png)

#### 스터디방 이용

![스터디방 이용 플로우](docs/portfolio/flows/live-study-flow.png)

</details>

### 화면 설계

<details>
<summary>이미지 보기</summary>

#### 메인페이지

![메인페이지](docs/portfolio/screen-design/mainpage.png)

#### 메인페이지 - 입장

![메인페이지 - 입장](docs/portfolio/screen-design/mainpage-modal.png)

---

#### 스터디방 생성 페이지

![스터디방 생성 페이지](docs/portfolio/screen-design/roomcreate.png)

#### 스터디방 생성 페이지 - 확인

![스터디방 생성 페이지 - 확인](docs/portfolio/screen-design/roomcreate-confirm.png)

#### 스터디방 생성 페이지 - 초기화

![스터디방 생성 페이지 - 초기화](docs/portfolio/screen-design/roomcreate-reset.png)

---

#### 실시간 스터디방 페이지

![실시간 스터디방 페이지](docs/portfolio/screen-design/studyroom.png)

#### 실시간 스터디방 페이지 - 멤버 관리

![실시간 스터디방 페이지 - 멤버 관리](docs/portfolio/screen-design/studyroom-members.png)

#### 실시간 스터디방 페이지 - 캘린더/플래너

![실시간 스터디방 페이지 - 캘린더/플래너](docs/portfolio/screen-design/studyroom-calendar.png)
![실시간 스터디방 페이지 - 캘린더/플래너](docs/portfolio/screen-design/studyroom-planner.png)

#### 실시간 스터디방 페이지 - 공지사항

![실시간 스터디방 페이지 - 공지사항](docs/portfolio/screen-design/studyroom-notice.png)

#### 실시간 스터디방 페이지 - 설정

![실시간 스터디방 페이지 - 설정](docs/portfolio/screen-design/studyroom-settings.png)

---

#### 내 프로필 페이지

![내 프로필 페이지](docs/portfolio/screen-design/profile.png)

#### 내 프로필 페이지 - 비밀번호 변경

![내 프로필 페이지 - 비밀번호 변경](docs/portfolio/screen-design/profile-password.png)

#### 내 프로필 페이지 - 탈퇴

![내 프로필 페이지 - 탈퇴](docs/portfolio/screen-design/profile-withdraw.png)

---

#### 내 스터디 페이지

![내 스터디 페이지](docs/portfolio/screen-design/mystudy.png)

#### 내 스터디 페이지 - 삭제

![내 스터디 페이지 - 삭제](docs/portfolio/screen-design/mystudy-delete.png)

---

#### 방문한 방 페이지

![방문한 방 페이지](docs/portfolio/screen-design/visited.png)

---

#### 검색 결과 페이지

![검색 결과 페이지](docs/portfolio/screen-design/search.png)

</details>

### 백엔드 CI/CD 및 AWS 배포 구조

<details>
<summary>이미지 보기</summary>

![백엔드 CI/CD 및 AWS 배포 구조](docs/portfolio/cicd/cicd-deploy-architecture-flow.png)

</details>

### 프로젝트 디렉터리 구조

<details>
<summary>내용 보기</summary>

[프로젝트 구조 상세 문서](docs/portfolio/project-structure/project-structure-portfolio.md)

</details>

---

## 📖 Notion 상세 포트폴리오

담당 기능별 상세 구현 과정, 트러블슈팅, 배운 점은 아래 Notion 포트폴리오에서 확인하실 수 있습니다.

🔗 [Notion 포트폴리오 바로가기](https://hello0a.notion.site/StudyCast-AWS-39bbff13bc7980058317c0b65b1883b8)
