package com.younghee.studycast.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.RoomMapper;
import com.younghee.studycast.dto.RoomCreateRequest;
import com.younghee.studycast.dto.RoomParticipantDTO;
import com.younghee.studycast.dto.RoomsDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomMapper roomMapper;

    @Override
    @Transactional
    public RoomsDTO createRoom(UUID userUuid, RoomCreateRequest request) {
        RoomsDTO room = new RoomsDTO();
        room.setUserUuid(userUuid);
        room.setCategoryNo(request.getCategoryNo() != null ? request.getCategoryNo().longValue() : 0L);
        room.setRoomTitle(request.getRoomTitle());
        room.setRoomDescription(request.getRoomDescription());
        Integer maxUsers = request.getMaxUsers();
        room.setMaxUser(maxUsers != null ? maxUsers.intValue() : 4);
        room.setNowUser(1);
        room.setRoomPassword(request.getRoomPassword());
        room.setRoomNotice(request.getRoomNotice());
        Boolean roomPrivate = request.getRoomPrivate();
        room.setRoomPrivate(roomPrivate != null && roomPrivate.booleanValue());
        Boolean roomPremium = request.getRoomPremium();
        room.setRoomPremium(roomPremium != null && roomPremium.booleanValue());
        room.setRoomThumbnail(request.getRoomThumbnail());
        room.setExpiredAt(request.getExpiredAt());

        int result = roomMapper.insertRoom(room);
        if (result != 1) {
            throw new RuntimeException("스터디룸 생성에 실패했습니다.");
        }

        RoomParticipantDTO participant = new RoomParticipantDTO();
        participant.setUserUuid(userUuid);
        participant.setRoomNo(room.getRoomNo());
        participant.setCameraStatus(false);
        participant.setMicStatus(false);
        roomMapper.insertParticipant(participant);

        return room;
    }

    @Override
    public RoomsDTO getRoom(Long roomNo) {
        return roomMapper.selectRoomById(roomNo);
    }

    @Override
    @Transactional
    public RoomsDTO updateNotice(UUID userUuid, Long roomNo, String notice) {
        RoomsDTO room = roomMapper.selectRoomById(roomNo);
        if (room == null) {
            throw new RuntimeException("존재하지 않는 스터디룸입니다.");
        }
        if (!room.getUserUuid().equals(userUuid)) {
            throw new RuntimeException("호스트 권한이 없습니다.");
        }
        if (notice != null && notice.length() > 500) {
            throw new RuntimeException("공지사항은 최대 500자까지 입력 가능합니다.");
        }
        roomMapper.updateRoomNotice(roomNo, notice);
        room.setRoomNotice(notice);
        return room;
    }

    @Override
    @Transactional
    public void deleteNotice(UUID userUuid, Long roomNo) {
        RoomsDTO room = roomMapper.selectRoomById(roomNo);
        if (room == null) {
            throw new RuntimeException("존재하지 않는 스터디룸입니다.");
        }
        if (!room.getUserUuid().equals(userUuid)) {
            throw new RuntimeException("호스트 권한이 없습니다.");
        }
        roomMapper.clearRoomNotice(roomNo);
    }

    @Override
    @Transactional
    public RoomsDTO joinRoom(UUID userUuid, Long roomNo) {
        RoomsDTO room = roomMapper.selectRoomById(roomNo);
        if (room == null) {
            throw new RuntimeException("존재하지 않는 스터디룸입니다.");
        }
        if (room.getNowUser() >= room.getMaxUser()) {
            throw new RuntimeException("정원이 꽉 찼습니다.");
        }
        if (!roomMapper.existsParticipant(userUuid, roomNo)) {
            RoomParticipantDTO participant = new RoomParticipantDTO();
            participant.setUserUuid(userUuid);
            participant.setRoomNo(roomNo);
            participant.setCameraStatus(false);
            participant.setMicStatus(false);
            roomMapper.insertParticipant(participant);
            roomMapper.updateRoomUserCount(roomNo, 1);
            room.setNowUser(room.getNowUser() + 1);
        }
        return room;
    }

    @Override
    @Transactional
    public void leaveRoom(UUID userUuid, Long roomNo) {
        if (roomMapper.existsParticipant(userUuid, roomNo)) {
            roomMapper.deleteParticipant(userUuid, roomNo);
            roomMapper.updateRoomUserCount(roomNo, -1);
        }
    }

    @Override
    public boolean isParticipant(UUID userUuid, Long roomNo) {
        return roomMapper.existsParticipant(userUuid, roomNo);
    }
}
