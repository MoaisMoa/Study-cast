package com.younghee.studycast.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    // 서버(호스트/DB)의 실제 타임존이 무엇이든 "오늘"은 항상 한국 기준으로 판정 (운영 서버가 UTC로 동작 중이라 CURRENT_DATE에 맡기면 자정~오전 9시 사이 기록이 전날로 적립될 수 있음)
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    // REQUIRES_NEW: leaveRoom 트랜잭션과 독립된 별도 트랜잭션으로 실행
    // → 이 메서드가 실패해도 leaveParticipant + syncNowUsers 롤백을 막음
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveTodayStudySeconds(UUID userUuid, int studySeconds) {
        studyLogMapper.upsertTodayStudySeconds(userUuid, studySeconds, LocalDate.now(KST));
    }

    @Transactional(readOnly = true)
    public int getTodayStudySeconds(UUID userUuid) {
        return studyLogMapper.findTodayStudySeconds(userUuid, LocalDate.now(KST));
    }

    @Transactional(readOnly = true)
    public MonthlyStudyResponse getMonthlyStats(UUID userUuid, int year, int month) {
        List<StudyLogDTO> logs = studyLogMapper.findMonthlyStudyLogs(userUuid, year, month);

        int attendDays = 0;
        int totalSeconds = 0;
        Map<Integer, Integer> dailySeconds = new HashMap<>();
        for (StudyLogDTO log : logs) {
            if (log.getTotalSeconds() < 7200) continue;
            attendDays++;
            totalSeconds += log.getTotalSeconds();
            dailySeconds.put(log.getStudyDate().getDayOfMonth(), log.getTotalSeconds());
        }

        return new MonthlyStudyResponse(attendDays, totalSeconds, dailySeconds);
    }
}