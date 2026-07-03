package com.younghee.studycast.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.config.StudyRoomPolicyProperties;
import com.younghee.studycast.dao.RoomParticipantsMapper;
import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.domain.RoomCategory;
import com.younghee.studycast.exception.ForbiddenException;
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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {
    
    // 제목, 공지사항, 기간 최대값
    private static final int MIN_TITLE_LENGTH = 2;
    private static final int MAX_TITLE_LENGTH = 10;
    private static final int MAX_NOTICE_LENGTH = 500;
    private static final int MAX_PERIOD_DAYS = 90;

    private final RoomsMapper roomsMapper;
    private final StudyRoomPolicyProperties studyRoomPolicyProperties;
    private final RoomImageStorageService roomImageStorageService;
    // 추가) 방 상세
    private final RoomParticipantsMapper roomParticipantsMapper;
    private final StudyLogService studyLogService;
    private final RoomVisitHistoriesService roomVisitHistoriesService;
    private final EmailService emailService;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Transactional
    public RoomCreateResponse createRoom(
        UUID userUuid, 
        RoomCreateRequest request, 
        MultipartFile image
    ) {
        // 1. 로그인 사용자 UUID 검증
        validateUserUuid(userUuid);
        // 3. 방 생성 요청값 검증
        validateCreateRequest(request);
        String thumbnailPath = roomImageStorageService.store(image);

        try {
            // 3. 종료일을 해당 날짜의 마지막 시간으로 변환
            LocalDateTime expiredAt = request.getExpiredAt().atTime(23, 59, 59);
            // 4. 공개/비공개 여부에 따라 참여 코드 저장값 결정
            String roomPassword = resolveRoomPassword(
                request.getRoomPrivate(),
                request.getRoomPassword()
            );
            // 5. 방 생성 RoomsDTO 생성
            RoomsDTO room = RoomsDTO.builder()
                                    .userUuid(userUuid)
                                    .categoryNo(request.getCategoryNo())
                                    .roomTitle(request.getRoomTitle().trim())
                                    .maxUsers(request.getMaxUsers())
                                    .nowUsers(0)
                                    .roomPassword(roomPassword)
                                    .roomNotice(trimToNull(request.getRoomNotice()))
                                    .roomPrivate(request.getRoomPrivate())
                                    .roomPremium(false)
                                    .cameraStatus(request.getCameraStatus() != null ? request.getCameraStatus() : true)
                                    .micStatus(request.getMicStatus() != null ? request.getMicStatus() : false)
                                    .roomThumbnail(thumbnailPath)
                                    .expiredAt(expiredAt)
                                    .build();
            // 6. rooms 테이블에 생성된 방 저장
            int insertedRoomCount = roomsMapper.insertRoom(room);

            if (insertedRoomCount != 1 || room.getRoomNo() == null) {
                throw new IllegalStateException("스터디방 생성에 실패했습니다.");
            }
            // 7. 생성된 방 번호와 제목 응답
            return new RoomCreateResponse(
                room.getRoomNo(),
                room.getRoomTitle(),
                "스터디방이 생성되었습니다."
            );
        } catch (RuntimeException e) {
            // 10. DB 처리 실패 시 이미 저장된 이미지 삭제
            deleteStoredImageQuietly(thumbnailPath);
            // 11. 원래 예외를 다시 발생시켜 DB 트랜잭션 롤백
            throw e;
        }
        
    }

    @Override
    public JoinCodeCheckResponse checkJoinCodeDuplicate(String code) {
        // 1. 참여 코드의 필수 여부와 숫자 4~6자리 형식 검증하고,
        String normalizedCode = validateAndNormalizeJoinCode(code);
        // 2. DB에서 동일한 비공개 방 참여 코드가 존재하는지 확인
        boolean duplicate =
            roomsMapper.existsByRoomPassword(normalizedCode);
        // 3. 확인한 코드, 중복 여부, 안내 메시지를 응답 DTO로 반환
        return new JoinCodeCheckResponse(
            normalizedCode,
            duplicate,
            duplicate
                ? "이미 사용 중인 참여 코드입니다."
                : "사용 가능한 참여 코드입니다."
        );
    }

    @Override
    @Transactional(readOnly = true)
    public RoomDetailResponse getRoomDetail(Long roomNo, UUID userUuid) {
        // 1. roomNo 유효성 검증
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("유효하지 않은 스터디방 번호입니다.");
        }
        // 2. 로그인 사용자 검증
        if (userUuid == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }
        // 3. 방 상세 헤더 정보 조회
        // rooms + categories 조인 결과와 owner/expired 계산값을 응답 DTO로 받음
        RoomDetailResponse response = roomsMapper.findRoomDetailByRoomNo(roomNo, userUuid);
        // 4. 조회 결과 없으면 존재하지 않는 방
        if (response == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        // 5. 상세 페이지 헤더 응답 반환
        return response;
    }

    @Override
    @Transactional
    public RoomJoinResponse joinRoom(Long roomNo, UUID userUuid, RoomJoinRequest request) {
        // 1. roomNo 검증
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("유효하지 않은 스터디방 번호입니다.");
        }
        // 2. 로그인 사용자 UUID 검증
        if (userUuid == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }
        // 3. 방 존재 여부 확인
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);
        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        // 4. 만료된 방 입장 차단
        if (room.getExpiredAt() != null && room.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("만료된 스터디방입니다.");
        }
        // 5. 이미 active 상태면 코드 검증 없이 중복 입장 처리
        boolean alreadyActive = roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid);

        if (alreadyActive) {
            // 5-1. joined_at·study_seconds 초기화 (탭 닫고 재입장 시 이전 세션의 joined_at이 남아 참석 시간이 크게 보이는 버그 방지)
            roomParticipantsMapper.rejoinParticipant(roomNo, userUuid);
            // 5-2. 현재 active 참여자 수 기준으로 rooms.now_users 동기화
            roomsMapper.syncNowUsersByActiveParticipants(roomNo);
            // 5-3. 동기화된 현재 인원 조회
            Integer currentUsers = roomsMapper.findNowUsersByRoomNo(roomNo);
            // 5-4. 이미 입장 중인 상태로 성공 응답 반환
            return new RoomJoinResponse(
                roomNo,
                true,
                currentUsers,
                room.getMaxUsers(),
                LocalDateTime.now(),
                "이미 입장 중인 스터디방입니다."
            );
        }
        // 6. 방장 여부 계산
        boolean owner = userUuid.equals(room.getUserUuid());

        // 7. 비공개방이면 joinCode 검증 (방장도 동일하게 코드 검증, 첫 입장 이후엔 5번의 active 체크로 재검증 면제)
        if (Boolean.TRUE.equals(room.getRoomPrivate())) {
            String joinCode = request == null ? null : request.getJoinCode();

            if (joinCode == null || joinCode.trim().isEmpty()) {
                throw new IllegalArgumentException("비공개 방은 참여 코드가 필요합니다.");
            }

            if (!joinCode.trim().equals(room.getRoomPassword())) {
                throw new SecurityException("참여 코드가 일치하지 않습니다.");
            }
        }
        // 8. 기존 참여 이력 조회
        RoomParticipantDTO existingParticipant =
            roomParticipantsMapper.findParticipantByRoomNoAndUserUuid(roomNo, userUuid);
        // 9. 입장 전 now_users를 실제 active 참여자 수로 동기화 후 조회
        roomsMapper.syncNowUsersByActiveParticipants(roomNo);
        Integer currentUsersBeforeJoin = roomsMapper.findNowUsersByRoomNo(roomNo);

        // 10. 정원 체크 (방장 슬롯은 정원 외로 취급 → 5/4 허용)
        if (!owner && room.getMaxUsers() != null) {
            boolean hostActive = roomParticipantsMapper.existsActiveParticipant(roomNo, room.getUserUuid());
            int nonHostCount = (currentUsersBeforeJoin != null ? currentUsersBeforeJoin : 0)
                               - (hostActive ? 1 : 0);
            if (nonHostCount >= room.getMaxUsers()) {
                throw new IllegalStateException("스터디방 정원이 가득 찼습니다.");
            }
        }

        // 11. 신규/재입장 참여자 처리
        if (existingParticipant == null) {
            RoomParticipantDTO participant = RoomParticipantDTO.builder()
                                                              .roomNo(roomNo)
                                                              .userUuid(userUuid)
                                                              .cameraStatus(Boolean.TRUE.equals(room.getCameraStatus()))
                                                              .micStatus(Boolean.TRUE.equals(room.getMicStatus()))
                                                              .active(true)
                                                              .build();

            roomParticipantsMapper.insertParticipant(participant);
        } else {
            // 12. 재입장 처리
            roomParticipantsMapper.rejoinParticipant(roomNo, userUuid);
        }
        // 13. active 참여자 수 기준으로 rooms.now_users 재계산
        roomsMapper.syncNowUsersByActiveParticipants(roomNo);
        // 14. 재계산된 현재 인원 조회
        Integer currentUsers = roomsMapper.findNowUsersByRoomNo(roomNo);
        // 15. 최근 방문 기록 저장
        roomVisitHistoriesService.recordVisit(roomNo, userUuid);
        // 16. 입장 성공 응답 반환
        return new RoomJoinResponse(
            roomNo,
            true,
            currentUsers,
            room.getMaxUsers(),
            LocalDateTime.now(),
            "스터디방에 입장했습니다."
        );
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RoomParticipantResponse> getActiveParticipants(Long roomNo) {
        // 1. roomNo 유효성 검증
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("유효하지 않은 스터디방 번호입니다.");
        }
        // 2. 방 존재 여부 확인
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);

        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        // 3. active=true 참여자 목록 조회
        return roomParticipantsMapper.findActiveParticipantsByRoomNo(roomNo);
    }

    @Override
    @Transactional
    public void leaveRoom(Long roomNo, UUID userUuid, int studiedSeconds) {
        // 1. roomNo 검증
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("유효하지 않은 스터디방 번호입니다.");
        }
        // 2. 로그인 사용자 UUID 검증
        if (userUuid == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }
        // 3. 방 존재 여부 확인
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);

        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        // 4. 현재 사용자의 참여 상태 조회
        RoomParticipantDTO participant =
            roomParticipantsMapper.findParticipantByRoomNoAndUserUuid(roomNo, userUuid);
        // 5. active 상태 아니면 퇴장 처리 불가
        if (participant == null || !Boolean.TRUE.equals(participant.getActive())) {
            throw new IllegalStateException("현재 입장 중인 스터디방이 아닙니다.");
        }
        // 6. room_participants 퇴장 처리
        int updated = roomParticipantsMapper.leaveParticipant(roomNo, userUuid);

        if (updated != 1) {
            throw new IllegalStateException("스터디방 퇴장 처리에 실패했습니다.");
        }
        // 7. active 참여자 수 기준으로 rooms.now_users 재계산
        roomsMapper.syncNowUsersByActiveParticipants(roomNo);
        // 8. 프론트 타이머 기준 오늘 공부 시간 누적 저장 (오늘 총 누적 + 이 방에서의 누적, 둘 다)
        if (studiedSeconds > 0) {
            try {
                studyLogService.saveTodayStudySeconds(userUuid, studiedSeconds);
                roomParticipantsMapper.incrementStudySeconds(roomNo, userUuid, studiedSeconds);
            } catch (Exception e) {
                log.warn("공부 시간 저장 실패 (퇴장 처리는 완료됨): roomNo={}, userUuid={}", roomNo, userUuid, e);
            }
        }
    }

    @Override
    @Transactional
    public RoomUpdateResponse updateRoomSettings(Long roomNo, UUID userUuid, RoomUpdateRequest request, MultipartFile image) {
        // 1. 방 존재 확인
        RoomsDTO room = roomsMapper.findByRoomNo(roomNo);
        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        // 2. 방장 권한 확인
        if (!userUuid.equals(room.getUserUuid())) {
            throw new ForbiddenException("방장만 설정을 변경할 수 있습니다.");
        }
        // 3. 요청값 검증
        validateRoomTitle(request.getRoomTitle());
        validateMaxUsers(request.getMaxUsers());
        validateExpiredAt(request.getExpiredAt());
        validateCategory(request.getCategoryNo());
        validateDeviceStatus(request.getCameraStatus(), request.getMicStatus());
        validateRoomNotice(request.getRoomNotice());
        // 4. 썸네일 처리 — 새 파일이 있을 때만 교체
        String thumbnailPath = room.getRoomThumbnail();
        String newThumbnailPath = null;
        if (image != null && !image.isEmpty()) {
            newThumbnailPath = roomImageStorageService.store(image);
            if (thumbnailPath != null) {
                deleteStoredImageQuietly(thumbnailPath);
            }
            thumbnailPath = newThumbnailPath;
        }
        // 5. DB 업데이트
        try {
            roomsMapper.updateRoom(roomNo, request, thumbnailPath);
        } catch (RuntimeException e) {
            if (newThumbnailPath != null) {
                deleteStoredImageQuietly(newThumbnailPath);
            }
            throw e;
        }
        return new RoomUpdateResponse(roomNo, thumbnailPath);
    }

    @Override
    @Transactional
    public String saveNotice(Long roomNo, UUID userUuid, String notice) {
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);
        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        if (!userUuid.equals(room.getUserUuid())) {
            throw new ForbiddenException("방장만 공지를 수정할 수 있습니다.");
        }
        String trimmed = (notice != null && !notice.trim().isEmpty()) ? notice.trim() : null;
        roomsMapper.updateRoomNotice(roomNo, trimmed);
        return trimmed;
    }

    @Override
    @Transactional
    public void kickMember(Long roomNo, UUID hostUuid, UUID targetUuid) {
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);
        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        if (!hostUuid.equals(room.getUserUuid())) {
            throw new ForbiddenException("방장만 멤버를 추방할 수 있습니다.");
        }
        if (hostUuid.equals(targetUuid)) {
            throw new IllegalArgumentException("자신을 추방할 수 없습니다.");
        }
        roomParticipantsMapper.leaveParticipant(roomNo, targetUuid);
        roomsMapper.syncNowUsersByActiveParticipants(roomNo);
    }

    @Override
    @Transactional
    public void closeRoom(Long roomNo, UUID userUuid) {
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);
        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        if (!userUuid.equals(room.getUserUuid())) {
            throw new ForbiddenException("방장만 스터디방을 종료할 수 있습니다.");
        }
        roomsMapper.closeRoom(roomNo);
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomNo, UUID userUuid) {
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);
        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        if (!userUuid.equals(room.getUserUuid())) {
            throw new ForbiddenException("방장만 스터디방을 삭제할 수 있습니다.");
        }

        // 접속 중인 참여자가 있으면 삭제 차단 (탭만 닫고 나가기를 안 누른 경우도 active로 남아있어 여기서 걸러짐)
        List<RoomParticipantResponse> activeParticipants = roomParticipantsMapper.findActiveParticipantsByRoomNo(roomNo);
        if (!activeParticipants.isEmpty()) {
            throw new IllegalStateException("스터디방에 접속 중인 사용자가 있어 삭제할 수 없습니다.");
        }

        String thumbnail = room.getRoomThumbnail();
        roomsMapper.deleteRoom(roomNo);
        if (thumbnail != null) {
            deleteStoredImageQuietly(thumbnail);
        }
    }

    @Override
    public void inviteMember(Long roomNo, UUID hostUuid, String toEmail) {
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);
        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        if (!hostUuid.equals(room.getUserUuid())) {
            throw new ForbiddenException("방장만 초대할 수 있습니다.");
        }
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("이메일 주소를 입력해주세요.");
        }

        // 방 페이지로 직행하지 않고 메인페이지 카드 모달(코드 입력 등 동일한 입장 절차)을 거치도록 함
        String roomLink = frontendUrl + "/?room=" + roomNo;
        String joinCode = Boolean.TRUE.equals(room.getRoomPrivate()) ? room.getRoomPassword() : null;

        emailService.sendRoomInvitation(toEmail.trim(), room.getRoomTitle(), roomLink, joinCode);
    }

    private void validateUserUuid(UUID userUuid) {
        if (userUuid == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
    }

    private void validateCreateRequest(RoomCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("방 생성 요청값이 없습니다.");
        }

        validateRoomTitle(request.getRoomTitle());
        validateRoomPrivate(request.getRoomPrivate());
        validateRoomPassword(request.getRoomPrivate(), request.getRoomPassword());
        validateMaxUsers(request.getMaxUsers());
        validateExpiredAt(request.getExpiredAt());
        validateDeviceStatus(request.getCameraStatus(), request.getMicStatus());
        validateCategory(request.getCategoryNo());
        validateRoomNotice(request.getRoomNotice());
    }


    private void validateRoomTitle(String roomTitle) {
        if (roomTitle == null || roomTitle.trim().isEmpty()) {
            throw new IllegalArgumentException("스터디 이름은 필수입니다.");
        }

        int titleLength = roomTitle.trim().length();

        if (titleLength < MIN_TITLE_LENGTH) {
            throw new IllegalArgumentException("스터디 이름은 2자 이상 입력해야 합니다.");
        }
        if (titleLength > MAX_TITLE_LENGTH) {
            throw new IllegalArgumentException("스터디 이름은 10자 이하로 입력해야 합니다.");
        }
    }

    private void validateRoomPrivate(Boolean roomPrivate) {
        if (roomPrivate == null) {
            throw new IllegalArgumentException("공개 여부는 필수입니다.");
        }
    }

    private void validateRoomPassword(Boolean roomPrivate, String roomPassword) {
        // 1. 공개 방이면 참여 코드 검증 없이 종료
        if (!Boolean.TRUE.equals(roomPrivate)) {
            return;
        }
        // 2. 비공개 방 참여 코드의 필수 여부와 형식을 검증하고 정규화
        String normalizedCode =
            validateAndNormalizeJoinCode(roomPassword);
        // 3. 실제 방 생성 시 동일한 참여 코드가 이미 존재하는지 재검증
        if (roomsMapper.existsByRoomPassword(normalizedCode)) {
            throw new IllegalArgumentException("이미 사용 중인 참여 코드입니다.");
        }
    }

    private void validateMaxUsers(Integer maxUsers) {
        if (maxUsers == null) {
            throw new IllegalArgumentException("최대 인원은 필수입니다.");
        }

        int maxUsersLimit = studyRoomPolicyProperties.getMaxUsersLimit();

        if (maxUsers < 1 || maxUsers > maxUsersLimit) {
            throw new IllegalArgumentException(
                "최대 인원은 1명 이상 " + maxUsersLimit + "명 이하로 설정해야 합니다."
            );
        }
    }

    private void validateExpiredAt(LocalDate expiredAt) {
        if (expiredAt == null) {
            throw new IllegalArgumentException("종료일은 필수입니다.");
        }

        LocalDate today = LocalDate.now();

        if (expiredAt.isBefore(today)) {
            throw new IllegalArgumentException("종료일은 오늘 이후 날짜로 설정해야 합니다.");
        }

        long periodDays = ChronoUnit.DAYS.between(today, expiredAt);

        if (periodDays > MAX_PERIOD_DAYS) {
            throw new IllegalArgumentException("스터디 기간은 최대 90일까지 설정할 수 있습니다.");
        }
    }

    private void validateDeviceStatus(Boolean cameraStatus, Boolean micStatus) {
        if (cameraStatus == null) {
            throw new IllegalArgumentException("카메라 기본 상태는 필수입니다.");
        }
        if (micStatus == null) {
            throw new IllegalArgumentException("마이크 기본 상태는 필수입니다.");
        }
    }

    private void validateCategory(Long categoryNo) {
        if (!RoomCategory.exists(categoryNo)) {
            throw new IllegalArgumentException("존재하지 않는 카테고리입니다.");
        }
    }

    private void validateRoomNotice(String roomNotice) {
        if (roomNotice != null && roomNotice.trim().length() > MAX_NOTICE_LENGTH) {
            throw new IllegalArgumentException("공지사항은 500자 이하로 입력해야 합니다.");
        }
    }
    // 공개 방: room_private = false / room_password = null
    // 비공개 방: room_private = true / room_password = 입력값
    private String resolveRoomPassword(Boolean roomPrivate, String roomPassword) {
        if (Boolean.TRUE.equals(roomPrivate)) {
            return roomPassword.trim();
        }
        return null;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private void deleteStoredImageQuietly(String thumbnailPath) {
        if (thumbnailPath == null) {
            return;
        }

        try {
            roomImageStorageService.delete(thumbnailPath);
        } catch (RuntimeException deleteException) {
            // 이미지 삭제 실패가 원래 방 생성 실패 예외를 덮어쓰지 않도록 로그만 남기기
            log.warn(
                "방 생성 실패 후 대표 이미지 삭제에 실패했습니다. imagePath={}",
                thumbnailPath,
                deleteException
            );
        }
    }

    private String validateAndNormalizeJoinCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("참여 코드를 입력해주세요.");
        }

        String normalizedCode = code.trim();

        if (!normalizedCode.matches("^\\d{4,6}$")) {
            throw new IllegalArgumentException(
                "참여 코드는 숫자 4~6자리로 입력해야 합니다."
            );
        }

        return normalizedCode;
    }

}