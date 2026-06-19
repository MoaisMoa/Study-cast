package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.PaymentHistoryDTO;

@Mapper
public interface PaymentHistoryMapper {

    int insertPaymentHistory(PaymentHistoryDTO history);

    List<PaymentHistoryDTO> findByUserUuid(@Param("userUuid") UUID userUuid);
}
