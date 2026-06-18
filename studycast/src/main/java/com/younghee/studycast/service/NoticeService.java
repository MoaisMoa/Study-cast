package com.younghee.studycast.service;

import com.younghee.studycast.dto.RoomsDTO;

public interface NoticeService {
    void saveNotice(RoomsDTO roomsDTO);
    void deleteNotice(Long roomsNo);
    String getNotice(Long roomsNo);
}
