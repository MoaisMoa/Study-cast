package com.younghee.studycast.dao;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.StudyLogDTO;

@Mapper
public interface StudyLogMapper {
    // 오늘 공부 시간 누적 저장 (studyDate는 KST 기준으로 호출부에서 계산해서 전달 — 서버 타임존에 의존하지 않기 위함)
    int upsertTodayStudySeconds(
        @Param("userUuid") UUID userUuid,
        @Param("studySeconds") int studySeconds,
        @Param("studyDate") LocalDate studyDate
    );

    // 오늘 누적 공부 시간 조회 (없으면 0)
    int findTodayStudySeconds(@Param("userUuid") UUID userUuid, @Param("studyDate") LocalDate studyDate);

    // 특정 연월의 일별 공부 기록 조회
    List<StudyLogDTO> findMonthlyStudyLogs(
        @Param("userUuid") UUID userUuid,
        @Param("year") int year,
        @Param("month") int month
    );
}
