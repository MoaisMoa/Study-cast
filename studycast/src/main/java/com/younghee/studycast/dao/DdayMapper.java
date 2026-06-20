package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.DdaysDTO;

@Mapper
public interface DdayMapper {

    // 사용자의 전체 디데이 목록 조회
    List<DdaysDTO> findAllByUser(@Param("userUuid") UUID userUuid);

    // 디데이 등록
    void insert(@Param("userUuid") UUID userUuid,
                @Param("ddayTitle") String ddayTitle,
                @Param("ddayType") String ddayType,
                @Param("targetDate") java.time.LocalDate targetDate);

    // 디데이 삭제 (본인 소유 검증 포함)
    int deleteByIdAndUser(@Param("ddayNo") Long ddayNo,
                          @Param("userUuid") UUID userUuid);
}
