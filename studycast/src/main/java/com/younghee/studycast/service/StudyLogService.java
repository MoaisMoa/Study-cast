package com.younghee.studycast.service;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.StudyLogMapper;
import com.younghee.studycast.dto.StudyLogDTO;
import com.younghee.studycast.dto.response.MonthlyStudyResponse;

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

    @Transactional(readOnly = true)
    public MonthlyStudyResponse getMonthlyStudyStats(UUID userUuid, int year, int month) {
        var logs = studyLogMapper.findMonthlyStudyLogs(userUuid, year, month);

        int attendDays = logs.size();
        int totalSeconds = logs.stream().mapToInt(StudyLogDTO::getTotalSeconds).sum();
        Map<Integer, Integer> dailySeconds = logs.stream().collect(
            Collectors.toMap(
                l -> l.getStudyDate().getDayOfMonth(),
                StudyLogDTO::getTotalSeconds
            )
        );

        return new MonthlyStudyResponse(attendDays, totalSeconds, dailySeconds);
    }
}
