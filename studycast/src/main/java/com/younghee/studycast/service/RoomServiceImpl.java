package com.younghee.studycast.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.config.StudyRoomPolicyProperties;
import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.domain.RoomCategory;
import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.dto.request.RoomCreateRequest;
import com.younghee.studycast.dto.response.JoinCodeCheckResponse;
import com.younghee.studycast.dto.response.RoomCreateResponse;

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

    @Override
    @Transactional
    // 핵심: 트랜잭션
    // 방 생성 혹은 방장 등록 둘중 하나라도 실패 시 전체 롤백
    public RoomCreateResponse createRoom(
        UUID userUuid, 
        RoomCreateRequest request, 
        MultipartFile image
    ) {
        // 1. 로그인 사용자 UUID 검증
        validateUserUuid(userUuid);
        // 2. 방 생성 요청값 검증
        validateCreateRequest(request);
        // 추가) 대표 이미지 검증 및 실제 파일 저장
        String thumbnailPath = roomImageStorageService.store(image);

        try {
            // 3. 종료일 요청받기
            LocalDateTime expiredAt = request.getExpiredAt().atTime(23, 59, 59);
            // 4. 공개/비공개 여부에 따라 참여 코드 처리
            String roomPassword = resolveRoomPassword(
                request.getRoomPrivate(),
                request.getRoomPassword()
            );
            // 5. RoomsDTO 생성 (now_users는 실제 입장 시점에 증가하므로 0으로 초기화)
            RoomsDTO room = RoomsDTO.builder()
                                    .userUuid(userUuid)
                                    .categoryNo(request.getCategoryNo())
                                    .roomTitle(request.getRoomTitle().trim())
                                    .maxUsers(request.getMaxUsers())
                                    .nowUsers(0)
                                    .roomPassword(roomPassword)
                                    .roomNotice(trimToNull(request.getRoomNotice()))
                                    .roomPrivate(request.getRoomPrivate())
                                    .roomThumbnail(thumbnailPath)
                                    .expiredAt(expiredAt)
                                    .build();
            // 6. rooms 테이블에 생성된 roomNo 받기 (핵심)
            int insertedRoomCount = roomsMapper.insertRoom(room);

            if (insertedRoomCount != 1 || room.getRoomNo() == null) {
                throw new IllegalStateException("스터디방 생성에 실패했습니다.");
            }
            // 7. RoomCreateResponse 반환 (방 입장은 별도 join API에서 처리)
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
        // 앞뒤 공백 제거한 정규화된 참여 코드를 반환받음
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

        if (!expiredAt.isAfter(today)) {
            throw new IllegalArgumentException("종료일은 오늘 이후 날짜로 설정해야 합니다.");
        }

        long periodDays = ChronoUnit.DAYS.between(today, expiredAt) + 1;

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
