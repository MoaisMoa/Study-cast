package com.younghee.dao;

import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.dto.UserDTO;

@Mapper
public interface UsersMapper {
    UserDTO selectUserByUuid(UUID userUuid);
    int updateUserProfile(UserDTO userDTO);
    UserDTO selectUserByEmail(@Param("userEmail") String userEmail);
    int deactivateUser(UUID userUuid);
}
