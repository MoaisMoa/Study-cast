package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.younghee.studycast.dao.StudyLogMapper;
import com.younghee.studycast.dto.StudyLogDTO;
import com.younghee.studycast.dto.response.MonthlyStudyResponse;

/**
 * StudyLogService 단위 테스트
 *
 * ── 주요 기능 ────────────────────────────────────────────────────────────────
 * saveTodayStudySeconds() : 오늘 공부 시간 누적 저장
 * getTodayStudySeconds()  : 오늘 누적 공부 시간 조회
 * getMonthlyStats()       : 월간 학습 통계 계산
 *                           - attendDays  : 공부 기록이 있는 날 수
 *                           - totalSeconds: 이달 총 공부 시간(초)
 *                           - dailySeconds: 일(day) → 공부 시간(초) 맵
 *
 * ── 핵심 검증 포인트 ──────────────────────────────────────────────────────────
 * getMonthlyStats 는 DB에서 받은 StudyLogDTO 목록을 직접 계산하는 로직이 있다.
 * 특히 totalSeconds <= 0 인 날은 출석일로 카운트하지 않는다는 규칙이 중요하다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StudyLogService — 월간 학습 통계 단위 테스트")
class StudyLogServiceTest {

    @Mock private StudyLogMapper studyLogMapper;

    @InjectMocks
    private StudyLogService studyLogService;

    private static final UUID USER_UUID = UUID.randomUUID();

    // ────────────────────────────────────────────────────────────────────────
    // 1. getMonthlyStats() — 월간 통계 계산
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("기록 없는 달: attendDays=0, totalSeconds=0, dailySeconds 비어 있음")
    void getMonthlyStats_emptyLogs_returnsZeros() {
        // given: DB에 이번 달 학습 기록 없음
        given(studyLogMapper.findMonthlyStudyLogs(USER_UUID, 2025, 6)).willReturn(List.of());

        // when
        MonthlyStudyResponse resp = studyLogService.getMonthlyStats(USER_UUID, 2025, 6);

        // then
        assertThat(resp.getAttendDays()).isZero();
        assertThat(resp.getTotalSeconds()).isZero();
        assertThat(resp.getDailySeconds()).isEmpty();
    }

    @Test
    @DisplayName("여러 날 공부 기록: 출석일 수·총 시간·일별 맵이 정확하게 집계됨")
    void getMonthlyStats_multipleLogs_correctAggregation() {
        // given: 1일 1시간, 5일 2시간 기록
        StudyLogDTO day1 = makeLog(LocalDate.of(2025, 6, 1), 3600);
        StudyLogDTO day5 = makeLog(LocalDate.of(2025, 6, 5), 7200);
        given(studyLogMapper.findMonthlyStudyLogs(USER_UUID, 2025, 6))
                .willReturn(List.of(day1, day5));

        // when
        MonthlyStudyResponse resp = studyLogService.getMonthlyStats(USER_UUID, 2025, 6);

        // then
        assertThat(resp.getAttendDays()).isEqualTo(2);
        assertThat(resp.getTotalSeconds()).isEqualTo(10800);
        assertThat(resp.getDailySeconds())
                .containsEntry(1, 3600)
                .containsEntry(5, 7200);
    }

    @Test
    @DisplayName("totalSeconds <= 0 인 날은 출석일에 포함하지 않고 dailySeconds 맵에도 넣지 않음")
    void getMonthlyStats_zeroOrNegativeSeconds_excludedFromAttendance() {
        // given: 0초(기록 있지만 공부 안 함), -1초(이상 데이터), 1800초(정상)
        StudyLogDTO zeroDay    = makeLog(LocalDate.of(2025, 6, 10), 0);
        StudyLogDTO negativeDay = makeLog(LocalDate.of(2025, 6, 11), -1);
        StudyLogDTO normalDay  = makeLog(LocalDate.of(2025, 6, 12), 1800);
        given(studyLogMapper.findMonthlyStudyLogs(USER_UUID, 2025, 6))
                .willReturn(List.of(zeroDay, negativeDay, normalDay));

        // when
        MonthlyStudyResponse resp = studyLogService.getMonthlyStats(USER_UUID, 2025, 6);

        // then: 0초·음수인 날은 출석일 및 일별 맵에서 제외
        assertThat(resp.getAttendDays()).isEqualTo(1);
        assertThat(resp.getTotalSeconds()).isEqualTo(1800);
        assertThat(resp.getDailySeconds()).containsOnlyKeys(12);
    }

    @Test
    @DisplayName("단 하루만 공부한 달: 출석일=1, 총 시간=그날 시간, 일별 맵 엔트리 1개")
    void getMonthlyStats_singleLog_correctValues() {
        StudyLogDTO single = makeLog(LocalDate.of(2025, 7, 15), 5400); // 1시간 30분
        given(studyLogMapper.findMonthlyStudyLogs(USER_UUID, 2025, 7))
                .willReturn(List.of(single));

        MonthlyStudyResponse resp = studyLogService.getMonthlyStats(USER_UUID, 2025, 7);

        assertThat(resp.getAttendDays()).isEqualTo(1);
        assertThat(resp.getTotalSeconds()).isEqualTo(5400);
        assertThat(resp.getDailySeconds()).hasSize(1).containsEntry(15, 5400);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. saveTodayStudySeconds() / getTodayStudySeconds()
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("saveTodayStudySeconds: 매퍼의 upsert 메서드를 올바른 인수로 호출해야 함")
    void saveTodayStudySeconds_callsMapperWithCorrectArgs() {
        // when
        studyLogService.saveTodayStudySeconds(USER_UUID, 1800);

        // then
        verify(studyLogMapper).upsertTodayStudySeconds(USER_UUID, 1800);
    }

    @Test
    @DisplayName("getTodayStudySeconds: 매퍼 반환값을 그대로 리턴해야 함")
    void getTodayStudySeconds_returnsMapperValue() {
        // given
        given(studyLogMapper.findTodayStudySeconds(USER_UUID)).willReturn(5400);

        // when & then
        assertThat(studyLogService.getTodayStudySeconds(USER_UUID)).isEqualTo(5400);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    private StudyLogDTO makeLog(LocalDate date, int totalSeconds) {
        StudyLogDTO dto = new StudyLogDTO();
        dto.setUserUuid(USER_UUID);
        dto.setStudyDate(date);
        dto.setTotalSeconds(totalSeconds);
        return dto;
    }
}
