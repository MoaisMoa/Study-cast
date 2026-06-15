package com.younghee.studycast.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.StudyLogMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StudyLogService {

    private final StudyLogMapper studyLogMapper;

    // REQUIRES_NEW: leaveRoom 트랜잭션과 독립된 별도 트랜잭션으로 실행
    // → 이 메서드가 실패해도 leaveParticipant + syncNowUsers 롤백을 막음
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveTodayStudySeconds(UUID userUuid, int studySeconds) {
        studyLogMapper.upsertTodayStudySeconds(userUuid, studySeconds);
    }

    @Transactional(readOnly = true)
    public int getTodayStudySeconds(UUID userUuid) {
        return studyLogMapper.findTodayStudySeconds(userUuid);
    }
}
