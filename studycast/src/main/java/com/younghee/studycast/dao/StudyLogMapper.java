package com.younghee.studycast.dao;

import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface StudyLogMapper {
    // 오늘 공부 시간 누적 저장
    int upsertTodayStudySeconds(
        @Param("userUuid") UUID userUuid,
        @Param("studySeconds") int studySeconds
    );

    // 오늘 누적 공부 시간 조회 (없으면 0)
    int findTodayStudySeconds(@Param("userUuid") UUID userUuid);
}
