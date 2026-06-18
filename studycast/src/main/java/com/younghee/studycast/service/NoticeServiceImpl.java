package com.younghee.studycast.service;

import org.springframework.stereotype.Service;

import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.dto.RoomsDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

    private static final int MAX_NOTICE_LENGTH = 500;

    private final RoomsMapper roomsMapper;

    @Override
    public void saveNotice(RoomsDTO roomsDTO) {
        if (roomsDTO == null || roomsDTO.getRoomNo() == null) {
            throw new IllegalArgumentException("방 번호가 필요합니다.");
        }

        String notice = trimToNull(roomsDTO.getRoomNotice());
        if (notice != null && notice.length() > MAX_NOTICE_LENGTH) {
            throw new IllegalArgumentException("공지사항은 500자 이하로 입력해야 합니다.");
        }

        roomsMapper.updateRoomNotice(roomsDTO.getRoomNo(), notice);
    }

    @Override
    public void deleteNotice(Long roomsNo) {
        if (roomsNo == null) {
            throw new IllegalArgumentException("방 번호가 필요합니다.");
        }

        roomsMapper.updateRoomNotice(roomsNo, null);
    }

    @Override
    public String getNotice(Long roomsNo) {
        if (roomsNo == null) {
            throw new IllegalArgumentException("방 번호가 필요합니다.");
        }

        RoomsDTO room = roomsMapper.findByRoomNo(roomsNo);
        if (room == null) {
            return null;
        }

        return room.getRoomNotice();
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}