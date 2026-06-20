package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.WeekPlanDTO;

@Mapper
public interface WeekPlanMapper {

    List<WeekPlanDTO> findAllByUser(@Param("userUuid") UUID userUuid);

    void insert(@Param("userUuid") UUID userUuid,
                @Param("dayOfWeek") int dayOfWeek,
                @Param("title") String title,
                @Param("color") String color,
                @Param("startTime") String startTime,
                @Param("endTime") String endTime);

    int update(@Param("planNo") Long planNo,
               @Param("userUuid") UUID userUuid,
               @Param("dayOfWeek") int dayOfWeek,
               @Param("title") String title,
               @Param("color") String color,
               @Param("startTime") String startTime,
               @Param("endTime") String endTime);

    int deleteByIdAndUser(@Param("planNo") Long planNo,
                          @Param("userUuid") UUID userUuid);
}
