package com.younghee.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserInterestsMapper {
    List<Integer> selectCategoryNosByUserUuid(UUID userUuid);
    int deleteInterestsByUserUuid(UUID userUuid);
    int insertUserInterest(@Param("userUuid") UUID userUuid, @Param("categoryNo") Integer categoryNo);
}
