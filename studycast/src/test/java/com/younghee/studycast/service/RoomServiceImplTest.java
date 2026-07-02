package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import com.younghee.studycast.config.StudyRoomPolicyProperties;
import com.younghee.studycast.dao.RoomParticipantsMapper;
import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.dto.RoomParticipantDTO;
import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.dto.request.RoomCreateRequest;
import com.younghee.studycast.dto.request.RoomJoinRequest;
import com.younghee.studycast.dto.request.RoomUpdateRequest;
import com.younghee.studycast.dto.response.JoinCodeCheckResponse;
import com.younghee.studycast.dto.response.RoomCreateResponse;
import com.younghee.studycast.dto.response.RoomDetailResponse;
import com.younghee.studycast.dto.response.RoomJoinResponse;
import com.younghee.studycast.dto.response.RoomParticipantResponse;
import com.younghee.studycast.dto.response.RoomUpdateResponse;
import com.younghee.studycast.exception.ForbiddenException;

/**
 * RoomServiceImpl 단위 테스트
 *
 * ── 이 테스트에서 새로 등장하는 개념 ──────────────────────────────────────────
 *
 * ReflectionTestUtils.setField(객체, "필드명", 값)
 *   @Value("${...}") 처럼 Spring이 주입해주는 값은 순수 Mockito 단위 테스트에서
 *   자동으로 들어오지 않는다. 이럴 때 리플렉션으로 직접 필드에 값을 넣어준다.
 *   → RoomServiceImpl의 frontendUrl 필드가 이에 해당한다.
 *
 * given(mock.메서드()).willReturn(값)  vs  given(mock.메서드()).willThrow(예외)
 *   willReturn : 해당 메서드 호출 시 지정한 값을 반환하게 한다.
 *   willThrow  : 해당 메서드 호출 시 지정한 예외를 던지게 한다.
 *
 * verify(mock, never()).메서드(...)
 *   "이 메서드가 한 번도 호출되지 않았음"을 검증한다.
 *   유효성 검증 실패로 일찍 예외가 터졌을 때 DB 저장이 실행되지 않았는지 확인할 때 유용하다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
// @BeforeEach에서 설정한 stub이 일부 테스트에서 사용되지 않아도 오류로 처리하지 않도록 설정.
// (Mockito 기본 strict 모드는 사용되지 않는 stub을 오류로 처리한다.)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RoomServiceImpl — 스터디방 서비스 단위 테스트")
class RoomServiceImplTest {

    // ── Mock 객체 선언 ──────────────────────────────────────────────────────
    @Mock private RoomsMapper              roomsMapper;
    @Mock private RoomParticipantsMapper   roomParticipantsMapper;
    @Mock private RoomImageStorageService  roomImageStorageService;
    @Mock private StudyRoomPolicyProperties policyProperties;
    @Mock private StudyLogService          studyLogService;
    @Mock private RoomVisitHistoriesService roomVisitHistoriesService;
    @Mock private EmailService             emailService;

    @InjectMocks
    private RoomServiceImpl roomService;

    /** @Value 필드는 Mockito가 주입하지 못하므로 @BeforeEach에서 직접 세팅 */
    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(roomService, "frontendUrl", "http://localhost:5173");
        // 최대 인원 정책: 테스트에서는 4명으로 고정
        given(policyProperties.getMaxUsersLimit()).willReturn(4);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. createRoom() — 방 생성
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createRoom — 정상(공개방): 방 생성 성공 시 방 번호·제목 반환")
    void createRoom_public_success() {
        // given
        UUID hostUuid = UUID.randomUUID();
        RoomCreateRequest req = makePublicRoomRequest("스터디방A");

        // DB 저장 후 roomNo가 채워지는 상황을 simulate
        // insertRoom 을 호출하면 내부적으로 room.setRoomNo(...)가 되는데,
        // Mockito doAnswer 대신 아래처럼 람다로 처리
        given(roomsMapper.insertRoom(any())).willAnswer(inv -> {
            RoomsDTO r = inv.getArgument(0);
            r.setRoomNo(42L); // DB가 채워줄 생성 key를 가짜로 설정
            return 1;         // 삽입 성공(1행 처리)을 의미
        });
        given(roomImageStorageService.store(null)).willReturn(null);

        // when
        RoomCreateResponse result = roomService.createRoom(hostUuid, req, null);

        // then
        assertThat(result.getRoomNo()).isEqualTo(42L);
        assertThat(result.getRoomTitle()).isEqualTo("스터디방A");
    }

    @Test
    @DisplayName("createRoom — 정상(이미지 업로드): store() 결과가 thumbnailPath로 DTO에 포함됨")
    void createRoom_withImage_success() {
        UUID hostUuid = UUID.randomUUID();
        RoomCreateRequest req = makePublicRoomRequest("스터디방B");
        org.springframework.mock.web.MockMultipartFile image =
                new org.springframework.mock.web.MockMultipartFile(
                        "image", "thumb.jpg", "image/jpeg", new byte[100]);

        given(roomImageStorageService.store(image)).willReturn("/uploads/thumb.jpg");
        given(roomsMapper.insertRoom(any())).willAnswer(inv -> {
            RoomsDTO r = inv.getArgument(0);
            r.setRoomNo(43L);
            return 1;
        });

        RoomCreateResponse result = roomService.createRoom(hostUuid, req, image);

        assertThat(result.getRoomNo()).isEqualTo(43L);
        // 이미지가 실제로 store()에 전달됐는지 확인
        verify(roomImageStorageService).store(image);
        // store() 결과가 insertRoom DTO의 thumbnailPath로 전달됐는지 확인
        ArgumentCaptor<RoomsDTO> captor = ArgumentCaptor.forClass(RoomsDTO.class);
        verify(roomsMapper).insertRoom(captor.capture());
        assertThat(captor.getValue().getRoomThumbnail()).isEqualTo("/uploads/thumb.jpg");
    }

    @Test
    @DisplayName("createRoom — 실패: null UUID면 IllegalArgumentException")
    void createRoom_nullUuid_throwsIllegalArgument() {
        assertThatThrownBy(() -> roomService.createRoom(null, makePublicRoomRequest("방"), null))
                .isInstanceOf(IllegalArgumentException.class);

        // DB 삽입이 아예 일어나지 않아야 함
        verify(roomsMapper, never()).insertRoom(any());
    }

    @Test
    @DisplayName("createRoom — 실패: 방 제목이 1자(최소 2자)면 IllegalArgumentException")
    void createRoom_titleTooShort_throwsIllegalArgument() {
        RoomCreateRequest req = makePublicRoomRequest("A"); // 1자
        assertThatThrownBy(() -> roomService.createRoom(UUID.randomUUID(), req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("2자 이상");
    }

    @Test
    @DisplayName("createRoom — 실패: 방 제목이 11자(최대 10자 초과)면 IllegalArgumentException")
    void createRoom_titleTooLong_throwsIllegalArgument() {
        RoomCreateRequest req = makePublicRoomRequest("12345678901"); // 11자
        assertThatThrownBy(() -> roomService.createRoom(UUID.randomUUID(), req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("10자 이하");
    }

    @Test
    @DisplayName("createRoom — 실패: 종료일이 과거이면 IllegalArgumentException")
    void createRoom_pastExpiredAt_throwsIllegalArgument() {
        RoomCreateRequest req = makePublicRoomRequest("스터디방");
        req.setExpiredAt(LocalDate.now().minusDays(1)); // 어제

        assertThatThrownBy(() -> roomService.createRoom(UUID.randomUUID(), req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("오늘 이후");
    }

    @Test
    @DisplayName("createRoom — 실패: 종료일이 90일 초과이면 IllegalArgumentException")
    void createRoom_expiredAtTooFar_throwsIllegalArgument() {
        RoomCreateRequest req = makePublicRoomRequest("스터디방");
        req.setExpiredAt(LocalDate.now().plusDays(91)); // 91일 후

        assertThatThrownBy(() -> roomService.createRoom(UUID.randomUUID(), req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("90일");
    }

    @Test
    @DisplayName("createRoom — 실패: 최대 인원이 정책 상한(4)을 초과하면 IllegalArgumentException")
    void createRoom_maxUsersExceedsLimit_throwsIllegalArgument() {
        RoomCreateRequest req = makePublicRoomRequest("스터디방");
        req.setMaxUsers(5); // 정책 상한 4 초과

        assertThatThrownBy(() -> roomService.createRoom(UUID.randomUUID(), req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("4명 이하");
    }

    @Test
    @DisplayName("createRoom — 실패: 비공개방에서 참여코드가 없으면 IllegalArgumentException")
    void createRoom_privateWithNoCode_throwsIllegalArgument() {
        RoomCreateRequest req = makePublicRoomRequest("스터디방");
        req.setRoomPrivate(true);
        req.setRoomPassword(null); // 코드 없음

        assertThatThrownBy(() -> roomService.createRoom(UUID.randomUUID(), req, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("createRoom — 실패: 비공개방 참여코드가 숫자 4~6자리가 아니면 IllegalArgumentException")
    void createRoom_invalidJoinCode_throwsIllegalArgument() {
        RoomCreateRequest req = makePublicRoomRequest("스터디방");
        req.setRoomPrivate(true);
        req.setRoomPassword("abc"); // 숫자 아님

        assertThatThrownBy(() -> roomService.createRoom(UUID.randomUUID(), req, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. checkJoinCodeDuplicate() — 참여코드 중복 확인
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("checkJoinCodeDuplicate — 정상: 중복 없는 코드 → isDuplicate=false")
    void checkJoinCode_notDuplicate() {
        // given: DB에 해당 코드가 없는 상황
        given(roomsMapper.existsByRoomPassword("1234")).willReturn(false);

        // when
        JoinCodeCheckResponse result = roomService.checkJoinCodeDuplicate("1234");

        // then
        assertThat(result.getDuplicate()).isFalse();
        assertThat(result.getCode()).isEqualTo("1234");
        assertThat(result.getMessage()).contains("사용 가능");
    }

    @Test
    @DisplayName("checkJoinCodeDuplicate — 정상: 중복된 코드 → isDuplicate=true")
    void checkJoinCode_duplicate() {
        // given: DB에 이미 동일한 코드가 있는 상황
        given(roomsMapper.existsByRoomPassword("5678")).willReturn(true);

        // when
        JoinCodeCheckResponse result = roomService.checkJoinCodeDuplicate("5678");

        // then
        assertThat(result.getDuplicate()).isTrue();
        assertThat(result.getMessage()).contains("이미 사용 중");
    }

    @Test
    @DisplayName("checkJoinCodeDuplicate — 실패: 숫자가 아닌 문자 포함 시 IllegalArgumentException")
    void checkJoinCode_nonNumeric_throwsIllegalArgument() {
        assertThatThrownBy(() -> roomService.checkJoinCodeDuplicate("ab12"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("checkJoinCodeDuplicate — 실패: 3자리(최소 4자리)면 IllegalArgumentException")
    void checkJoinCode_tooShort_throwsIllegalArgument() {
        assertThatThrownBy(() -> roomService.checkJoinCodeDuplicate("123"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. getRoomDetail() — 방 상세 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getRoomDetail — 정상: 존재하는 방 상세 정보 반환")
    void getRoomDetail_success() {
        // given
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        RoomDetailResponse fakeResponse = new RoomDetailResponse();
        given(roomsMapper.findRoomDetailByRoomNo(roomNo, userUuid)).willReturn(fakeResponse);

        // when
        RoomDetailResponse result = roomService.getRoomDetail(roomNo, userUuid);

        // then
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getRoomDetail — 실패: roomNo가 null이면 IllegalArgumentException")
    void getRoomDetail_nullRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> roomService.getRoomDetail(null, UUID.randomUUID()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getRoomDetail — 실패: userUuid가 null이면 SecurityException")
    void getRoomDetail_nullUserUuid_throwsSecurity() {
        assertThatThrownBy(() -> roomService.getRoomDetail(1L, null))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    @DisplayName("getRoomDetail — 실패: 존재하지 않는 방이면 NoSuchElementException")
    void getRoomDetail_notFound_throwsNoSuchElement() {
        // given: DB 조회 결과가 null
        given(roomsMapper.findRoomDetailByRoomNo(anyLong(), any())).willReturn(null);

        assertThatThrownBy(() -> roomService.getRoomDetail(99L, UUID.randomUUID()))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. joinRoom() — 방 입장
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("joinRoom — 정상(신규 입장): 공개방에 첫 입장 시 성공 응답 반환")
    void joinRoom_newMember_success() {
        // given
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        UUID hostUuid = UUID.randomUUID(); // 방장은 다른 사람

        RoomsDTO room = makePublicRoom(roomNo, hostUuid, 4);
        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        // 이미 입장 중이 아님
        given(roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)).willReturn(false);
        // 참여 이력 없음 (첫 입장)
        given(roomParticipantsMapper.findParticipantByRoomNoAndUserUuid(roomNo, userUuid))
                .willReturn(null);
        // 현재 인원 (방장만 있음: 1명)
        given(roomsMapper.findNowUsersByRoomNo(roomNo)).willReturn(1);
        // 방장은 활성 상태
        given(roomParticipantsMapper.existsActiveParticipant(roomNo, hostUuid)).willReturn(true);

        // when
        RoomJoinResponse response = roomService.joinRoom(roomNo, userUuid, null);

        // then
        assertThat(response.getJoined()).isTrue();
        // 신규 입장이므로 insertParticipant 가 호출됐어야 함
        verify(roomParticipantsMapper).insertParticipant(any());
        // 입장 완료 후 방문 기록도 반드시 저장됐어야 함
        verify(roomVisitHistoriesService).recordVisit(roomNo, userUuid);
    }

    @Test
    @DisplayName("joinRoom — 정상(이미 입장 중): 중복 입장 요청 시 이미 입장 중 응답 반환")
    void joinRoom_alreadyActive_returnsEarlySuccess() {
        // given: 이미 해당 방에 active 상태로 있는 경우
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(roomNo, UUID.randomUUID(), 4);

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)).willReturn(true);
        given(roomsMapper.findNowUsersByRoomNo(roomNo)).willReturn(2);

        // when
        RoomJoinResponse response = roomService.joinRoom(roomNo, userUuid, null);

        // then: 이미 입장 중이라는 메시지와 함께 성공 응답
        assertThat(response.getMessage()).contains("이미 입장 중");
        // 추가 DB 삽입은 일어나지 않아야 함
        verify(roomParticipantsMapper, never()).insertParticipant(any());
        // 이미 입장 중이므로 방문 기록이 중복 저장되지 않아야 함
        verify(roomVisitHistoriesService, never()).recordVisit(roomNo, userUuid);
    }

    @Test
    @DisplayName("joinRoom — 실패: 만료된 방은 IllegalStateException")
    void joinRoom_expiredRoom_throwsIllegalState() {
        // given: 이미 만료된 방 (expiredAt이 과거)
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(roomNo, UUID.randomUUID(), 4);
        room.setExpiredAt(LocalDateTime.now().minusDays(1)); // 어제 만료

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)).willReturn(false);

        assertThatThrownBy(() -> roomService.joinRoom(roomNo, userUuid, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("만료된");
    }

    @Test
    @DisplayName("joinRoom — 실패: 비공개방에 코드 없이 입장 시 IllegalArgumentException")
    void joinRoom_privateRoom_noCode_throwsIllegalArgument() {
        // given
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        RoomsDTO room = makePrivateRoom(roomNo, UUID.randomUUID(), "1234", 4);

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)).willReturn(false);

        // joinCode를 넣지 않은 요청
        assertThatThrownBy(() -> roomService.joinRoom(roomNo, userUuid, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("참여 코드");
    }

    @Test
    @DisplayName("joinRoom — 실패: 비공개방에 틀린 코드로 입장 시 SecurityException")
    void joinRoom_privateRoom_wrongCode_throwsSecurity() {
        // given
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        RoomsDTO room = makePrivateRoom(roomNo, UUID.randomUUID(), "1234", 4);

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)).willReturn(false);

        RoomJoinRequest wrongCodeRequest = new RoomJoinRequest();
        wrongCodeRequest.setJoinCode("9999"); // 틀린 코드

        assertThatThrownBy(() -> roomService.joinRoom(roomNo, userUuid, wrongCodeRequest))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("참여 코드가 일치하지 않습니다");
    }

    @Test
    @DisplayName("joinRoom — 실패: 정원(max_users=2)이 가득 찬 방은 IllegalStateException")
    void joinRoom_fullRoom_throwsIllegalState() {
        // given: max_users=2, 현재 방장+일반멤버 1명으로 이미 꽉 찬 상태
        Long roomNo = 1L;
        UUID hostUuid   = UUID.randomUUID();
        UUID userUuid   = UUID.randomUUID(); // 입장 시도하는 새 멤버

        RoomsDTO room = makePublicRoom(roomNo, hostUuid, 2); // 최대 2명
        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)).willReturn(false);
        given(roomParticipantsMapper.findParticipantByRoomNoAndUserUuid(roomNo, userUuid))
                .willReturn(null);
        // now_users = 3 (방장 1 + 일반멤버 2명으로 이미 꽉 참), max_users=2 이므로 nonHostCount(2) >= maxUsers(2) → 정원 초과
        given(roomsMapper.findNowUsersByRoomNo(roomNo)).willReturn(3);
        given(roomParticipantsMapper.existsActiveParticipant(eq(roomNo), eq(hostUuid))).willReturn(true);

        assertThatThrownBy(() -> roomService.joinRoom(roomNo, userUuid, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("정원이 가득");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. leaveRoom() — 방 퇴장
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("leaveRoom — 정상: 활성 참여자가 퇴장 처리 성공")
    void leaveRoom_success() {
        // given
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(makePublicRoom(roomNo, UUID.randomUUID(), 4));

        // 참여자가 active=true 상태
        RoomParticipantDTO participant = new RoomParticipantDTO();
        participant.setActive(true);
        given(roomParticipantsMapper.findParticipantByRoomNoAndUserUuid(roomNo, userUuid))
                .willReturn(participant);
        given(roomParticipantsMapper.leaveParticipant(roomNo, userUuid)).willReturn(1);

        // when: 예외 없이 완료되면 성공
        roomService.leaveRoom(roomNo, userUuid, 0);

        // then: 퇴장 처리 메서드가 호출됐는지 확인
        verify(roomParticipantsMapper).leaveParticipant(roomNo, userUuid);
    }

    @Test
    @DisplayName("leaveRoom — 정상: 공부 시간이 있으면 누적 저장까지 호출")
    void leaveRoom_withStudySeconds_savesStudyTime() {
        // given
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(makePublicRoom(roomNo, UUID.randomUUID(), 4));

        RoomParticipantDTO participant = new RoomParticipantDTO();
        participant.setActive(true);
        given(roomParticipantsMapper.findParticipantByRoomNoAndUserUuid(roomNo, userUuid))
                .willReturn(participant);
        given(roomParticipantsMapper.leaveParticipant(roomNo, userUuid)).willReturn(1);

        // when: 1800초(30분) 공부 후 퇴장
        roomService.leaveRoom(roomNo, userUuid, 1800);

        // then: 공부 시간 저장도 호출됐어야 함
        verify(studyLogService).saveTodayStudySeconds(userUuid, 1800);
        verify(roomParticipantsMapper).incrementStudySeconds(roomNo, userUuid, 1800);
    }

    @Test
    @DisplayName("leaveRoom — 실패: 입장 중이지 않은 사용자가 퇴장 시 IllegalStateException")
    void leaveRoom_notActive_throwsIllegalState() {
        // given: 참여 이력 자체가 없음
        Long roomNo = 1L;
        UUID userUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(makePublicRoom(roomNo, UUID.randomUUID(), 4));
        given(roomParticipantsMapper.findParticipantByRoomNoAndUserUuid(roomNo, userUuid))
                .willReturn(null);

        assertThatThrownBy(() -> roomService.leaveRoom(roomNo, userUuid, 0))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("입장 중인");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. deleteRoom() — 방 삭제
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteRoom — 정상: 방장이 비어있는 방 삭제 성공")
    void deleteRoom_success() {
        // given
        Long roomNo = 1L;
        UUID hostUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(roomNo, hostUuid, 4);

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        // 활성 참여자 없음 (빈 방)
        given(roomParticipantsMapper.findActiveParticipantsByRoomNo(roomNo))
                .willReturn(List.of());

        // when
        roomService.deleteRoom(roomNo, hostUuid);

        // then: DB 삭제 메서드 호출 확인
        verify(roomsMapper).deleteRoom(roomNo);
    }

    @Test
    @DisplayName("deleteRoom — 정상(썸네일 있는 방): 삭제 후 이미지 파일도 제거")
    void deleteRoom_withThumbnail_deletesImage() {
        // given: 썸네일이 있는 방
        Long roomNo = 1L;
        UUID hostUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(roomNo, hostUuid, 4);
        room.setRoomThumbnail("/uploads/thumb.jpg");

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        given(roomParticipantsMapper.findActiveParticipantsByRoomNo(roomNo))
                .willReturn(List.of());

        // when
        roomService.deleteRoom(roomNo, hostUuid);

        // then: DB 삭제 + 썸네일 이미지 삭제 모두 호출됐어야 함
        verify(roomsMapper).deleteRoom(roomNo);
        verify(roomImageStorageService).delete("/uploads/thumb.jpg");
    }

    @Test
    @DisplayName("deleteRoom — 실패: 방장이 아닌 사람이 삭제 시 ForbiddenException")
    void deleteRoom_notOwner_throwsForbidden() {
        // given
        Long roomNo = 1L;
        UUID hostUuid   = UUID.randomUUID();
        UUID attackerUuid = UUID.randomUUID(); // 방장이 아닌 사람
        RoomsDTO room = makePublicRoom(roomNo, hostUuid, 4);

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);

        assertThatThrownBy(() -> roomService.deleteRoom(roomNo, attackerUuid))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("방장만");
    }

    @Test
    @DisplayName("deleteRoom — 실패: 입장 중인 참여자가 있으면 IllegalStateException")
    void deleteRoom_hasActiveParticipants_throwsIllegalState() {
        // given: 활성 참여자가 1명 있는 상황
        Long roomNo = 1L;
        UUID hostUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(roomNo, hostUuid, 4);

        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(room);
        given(roomParticipantsMapper.findActiveParticipantsByRoomNo(roomNo))
                .willReturn(List.of(new RoomParticipantResponse())); // 1명 있음

        assertThatThrownBy(() -> roomService.deleteRoom(roomNo, hostUuid))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("접속 중인");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7. getActiveParticipants() — 참여자 목록 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getActiveParticipants — 정상: 활성 참여자 목록 반환")
    void getActiveParticipants_success() {
        // given
        Long roomNo = 1L;
        given(roomsMapper.findRoomByRoomNo(roomNo)).willReturn(makePublicRoom(roomNo, UUID.randomUUID(), 4));
        given(roomParticipantsMapper.findActiveParticipantsByRoomNo(roomNo))
                .willReturn(List.of(new RoomParticipantResponse(), new RoomParticipantResponse()));

        // when
        List<RoomParticipantResponse> result = roomService.getActiveParticipants(roomNo);

        // then
        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("getActiveParticipants — 실패: roomNo가 null이면 IllegalArgumentException")
    void getActiveParticipants_nullRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> roomService.getActiveParticipants(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getActiveParticipants — 실패: 존재하지 않는 방이면 NoSuchElementException")
    void getActiveParticipants_notFound_throwsNoSuchElement() {
        given(roomsMapper.findRoomByRoomNo(99L)).willReturn(null);

        assertThatThrownBy(() -> roomService.getActiveParticipants(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 8. updateRoomSettings() — 방 설정 수정 (방장 전용)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateRoomSettings — 실패: 존재하지 않는 방 → NoSuchElementException")
    void updateRoomSettings_roomNotFound_throwsNoSuchElement() {
        given(roomsMapper.findByRoomNo(99L)).willReturn(null);

        assertThatThrownBy(() -> roomService.updateRoomSettings(99L, UUID.randomUUID(), makeUpdateRequest(), null))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("존재하지 않는 스터디방");
    }

    @Test
    @DisplayName("updateRoomSettings — 실패: 방장이 아닌 사용자 → ForbiddenException")
    void updateRoomSettings_notOwner_throwsForbidden() {
        UUID hostUuid    = UUID.randomUUID();
        UUID attackerUuid = UUID.randomUUID();
        given(roomsMapper.findByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        assertThatThrownBy(() -> roomService.updateRoomSettings(1L, attackerUuid, makeUpdateRequest(), null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("방장만");
    }

    @Test
    @DisplayName("updateRoomSettings — 실패: 방 제목이 1자(최소 2자)이면 IllegalArgumentException")
    void updateRoomSettings_titleTooShort_throwsIllegalArgument() {
        UUID hostUuid = UUID.randomUUID();
        given(roomsMapper.findByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        RoomUpdateRequest req = makeUpdateRequest();
        req.setRoomTitle("A"); // 1자

        assertThatThrownBy(() -> roomService.updateRoomSettings(1L, hostUuid, req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("2자 이상");
    }

    @Test
    @DisplayName("updateRoomSettings — 실패: 방 제목이 11자(최대 10자 초과)이면 IllegalArgumentException")
    void updateRoomSettings_titleTooLong_throwsIllegalArgument() {
        UUID hostUuid = UUID.randomUUID();
        given(roomsMapper.findByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        RoomUpdateRequest req = makeUpdateRequest();
        req.setRoomTitle("12345678901"); // 11자

        assertThatThrownBy(() -> roomService.updateRoomSettings(1L, hostUuid, req, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("10자 이하");
    }

    @Test
    @DisplayName("updateRoomSettings — 정상: 이미지 없이 수정 성공 → 방 번호·기존 썸네일 반환")
    void updateRoomSettings_noImage_success() {
        UUID hostUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(1L, hostUuid, 4);
        room.setRoomThumbnail("/uploads/old.jpg");
        given(roomsMapper.findByRoomNo(1L)).willReturn(room);

        // when: 이미지 null → 기존 썸네일 유지
        RoomUpdateResponse resp = roomService.updateRoomSettings(1L, hostUuid, makeUpdateRequest(), null);

        // then
        assertThat(resp.getRoomNo()).isEqualTo(1L);
        assertThat(resp.getRoomThumbnail()).isEqualTo("/uploads/old.jpg");
        verify(roomsMapper).updateRoom(eq(1L), any(), eq("/uploads/old.jpg"));
    }

    @Test
    @DisplayName("updateRoomSettings — 정상: 새 이미지 업로드 시 썸네일 경로 교체")
    void updateRoomSettings_withNewImage_replacesThumb() {
        UUID hostUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(1L, hostUuid, 4);
        room.setRoomThumbnail("/uploads/old.jpg");
        given(roomsMapper.findByRoomNo(1L)).willReturn(room);

        // 새 이미지 저장 결과: 새 경로 반환
        org.springframework.mock.web.MockMultipartFile newImg =
                new org.springframework.mock.web.MockMultipartFile(
                        "image", "new.jpg", "image/jpeg", new byte[100]);
        given(roomImageStorageService.store(newImg)).willReturn("/uploads/new.jpg");

        // when
        RoomUpdateResponse resp = roomService.updateRoomSettings(1L, hostUuid, makeUpdateRequest(), newImg);

        // then: 새 경로로 업데이트됐어야 함
        assertThat(resp.getRoomThumbnail()).isEqualTo("/uploads/new.jpg");
        verify(roomsMapper).updateRoom(eq(1L), any(), eq("/uploads/new.jpg"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // 9. saveNotice() — 방 공지 수정 (방장 전용)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("saveNotice — 실패: 존재하지 않는 방 → NoSuchElementException")
    void saveNotice_roomNotFound_throwsNoSuchElement() {
        given(roomsMapper.findRoomByRoomNo(99L)).willReturn(null);

        assertThatThrownBy(() -> roomService.saveNotice(99L, UUID.randomUUID(), "공지사항"))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("saveNotice — 실패: 방장이 아닌 사용자 → ForbiddenException")
    void saveNotice_notOwner_throwsForbidden() {
        UUID hostUuid     = UUID.randomUUID();
        UUID attackerUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        assertThatThrownBy(() -> roomService.saveNotice(1L, attackerUuid, "공지"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("saveNotice — 정상: 공지 저장 후 trim 된 문자열 반환")
    void saveNotice_success_returnsTrimmedNotice() {
        UUID hostUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        String result = roomService.saveNotice(1L, hostUuid, "  오늘 스터디 9시!  ");

        assertThat(result).isEqualTo("오늘 스터디 9시!");
        verify(roomsMapper).updateRoomNotice(1L, "오늘 스터디 9시!");
    }

    @Test
    @DisplayName("saveNotice — 정상: 공백만 있는 공지는 null로 저장 (공지 삭제 효과)")
    void saveNotice_blankNotice_savesNull() {
        UUID hostUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        String result = roomService.saveNotice(1L, hostUuid, "   ");

        assertThat(result).isNull();
        verify(roomsMapper).updateRoomNotice(1L, null);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 10. kickMember() — 멤버 추방 (방장 전용)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("kickMember — 실패: 존재하지 않는 방 → NoSuchElementException")
    void kickMember_roomNotFound_throwsNoSuchElement() {
        given(roomsMapper.findRoomByRoomNo(99L)).willReturn(null);

        assertThatThrownBy(() -> roomService.kickMember(99L, UUID.randomUUID(), UUID.randomUUID()))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("kickMember — 실패: 방장이 아닌 사용자 → ForbiddenException")
    void kickMember_notOwner_throwsForbidden() {
        UUID hostUuid     = UUID.randomUUID();
        UUID attackerUuid = UUID.randomUUID();
        UUID targetUuid   = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        assertThatThrownBy(() -> roomService.kickMember(1L, attackerUuid, targetUuid))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("kickMember — 실패: 자기 자신을 추방 시도 → IllegalArgumentException")
    void kickMember_selfKick_throwsIllegalArgument() {
        UUID hostUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        // hostUuid와 targetUuid를 동일하게 넘김
        assertThatThrownBy(() -> roomService.kickMember(1L, hostUuid, hostUuid))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("자신을 추방");
    }

    @Test
    @DisplayName("kickMember — 정상: 참여자 탈퇴 처리 + 현재 인원 동기화 호출")
    void kickMember_success_callsLeaveAndSync() {
        UUID hostUuid   = UUID.randomUUID();
        UUID targetUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        roomService.kickMember(1L, hostUuid, targetUuid);

        verify(roomParticipantsMapper).leaveParticipant(1L, targetUuid);
        verify(roomsMapper).syncNowUsersByActiveParticipants(1L);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 11. closeRoom() — 스터디방 종료 (방장 전용)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("closeRoom — 실패: 존재하지 않는 방 → NoSuchElementException")
    void closeRoom_roomNotFound_throwsNoSuchElement() {
        given(roomsMapper.findRoomByRoomNo(99L)).willReturn(null);

        assertThatThrownBy(() -> roomService.closeRoom(99L, UUID.randomUUID()))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("closeRoom — 실패: 방장이 아닌 사용자 → ForbiddenException")
    void closeRoom_notOwner_throwsForbidden() {
        UUID hostUuid     = UUID.randomUUID();
        UUID attackerUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        assertThatThrownBy(() -> roomService.closeRoom(1L, attackerUuid))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("closeRoom — 정상: 방장이 종료 → closeRoom 매퍼 호출")
    void closeRoom_success_callsMapper() {
        UUID hostUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        roomService.closeRoom(1L, hostUuid);

        verify(roomsMapper).closeRoom(1L);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 12. inviteMember() — 이메일 초대 (방장 전용)
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("inviteMember — 실패: 존재하지 않는 방 → NoSuchElementException")
    void inviteMember_roomNotFound_throwsNoSuchElement() {
        given(roomsMapper.findRoomByRoomNo(99L)).willReturn(null);

        assertThatThrownBy(() -> roomService.inviteMember(99L, UUID.randomUUID(), "guest@test.com"))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    @DisplayName("inviteMember — 실패: 방장이 아닌 사용자 → ForbiddenException")
    void inviteMember_notOwner_throwsForbidden() {
        UUID hostUuid     = UUID.randomUUID();
        UUID attackerUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        assertThatThrownBy(() -> roomService.inviteMember(1L, attackerUuid, "guest@test.com"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("inviteMember — 실패: 이메일 null/공백 → IllegalArgumentException")
    void inviteMember_blankEmail_throwsIllegalArgument() {
        UUID hostUuid = UUID.randomUUID();
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(makePublicRoom(1L, hostUuid, 4));

        assertThatThrownBy(() -> roomService.inviteMember(1L, hostUuid, "  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일");
    }

    @Test
    @DisplayName("inviteMember — 정상(공개방): joinCode 없이 초대 이메일 발송")
    void inviteMember_publicRoom_sendsInvitationWithoutCode() {
        UUID hostUuid = UUID.randomUUID();
        RoomsDTO room = makePublicRoom(1L, hostUuid, 4);
        room.setRoomTitle("공개 스터디방");
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(room);

        roomService.inviteMember(1L, hostUuid, "guest@test.com");

        // 공개방은 joinCode=null 로 초대 메일 발송
        verify(emailService).sendRoomInvitation(
                eq("guest@test.com"),
                eq("공개 스터디방"),
                anyString(),   // roomLink
                eq((String) null)  // joinCode: 공개방이면 null
        );
    }

    @Test
    @DisplayName("inviteMember — 정상(비공개방): 참여 코드 포함해 초대 이메일 발송")
    void inviteMember_privateRoom_sendsInvitationWithCode() {
        UUID hostUuid = UUID.randomUUID();
        RoomsDTO room = makePrivateRoom(1L, hostUuid, "ABCD1234", 4);
        room.setRoomTitle("비공개 스터디방");
        given(roomsMapper.findRoomByRoomNo(1L)).willReturn(room);

        roomService.inviteMember(1L, hostUuid, "guest@test.com");

        // 비공개방은 roomPassword(해시)를 joinCode 로 전달
        verify(emailService).sendRoomInvitation(
                eq("guest@test.com"),
                eq("비공개 스터디방"),
                anyString(),      // roomLink
                eq("ABCD1234")    // joinCode: 비공개방의 비밀번호
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    /** 공개방 RoomsDTO 생성 (미래 만료일 기본 설정) */
    private RoomsDTO makePublicRoom(Long roomNo, UUID hostUuid, int maxUsers) {
        RoomsDTO room = new RoomsDTO();
        room.setRoomNo(roomNo);
        room.setUserUuid(hostUuid);
        room.setRoomTitle("테스트방");
        room.setRoomPrivate(false);
        room.setMaxUsers(maxUsers);
        room.setNowUsers(0);
        room.setCameraStatus(true);
        room.setMicStatus(false);
        room.setExpiredAt(LocalDateTime.now().plusDays(30)); // 30일 후 만료
        return room;
    }

    /** 비공개방 RoomsDTO 생성 */
    private RoomsDTO makePrivateRoom(Long roomNo, UUID hostUuid, String password, int maxUsers) {
        RoomsDTO room = makePublicRoom(roomNo, hostUuid, maxUsers);
        room.setRoomPrivate(true);
        room.setRoomPassword(password);
        return room;
    }

    /** 유효한 방 수정 요청 DTO 생성 */
    private RoomUpdateRequest makeUpdateRequest() {
        RoomUpdateRequest req = new RoomUpdateRequest();
        req.setRoomTitle("업데이트된 방");
        req.setMaxUsers(4);
        req.setExpiredAt(LocalDate.now().plusDays(30));
        req.setCategoryNo(3L);
        req.setCameraStatus(true);
        req.setMicStatus(false);
        req.setRoomNotice(null);
        return req;
    }

    /** 유효한 공개방 생성 요청 DTO 생성 (미래 날짜, 카테고리 3=개발·IT 사용) */
    private RoomCreateRequest makePublicRoomRequest(String title) {
        RoomCreateRequest req = new RoomCreateRequest();
        req.setRoomTitle(title);
        req.setRoomPrivate(false);
        req.setMaxUsers(4);
        req.setExpiredAt(LocalDate.now().plusDays(30));
        req.setCameraStatus(true);
        req.setMicStatus(false);
        req.setCategoryNo(3L); // 개발·IT
        return req;
    }
}
