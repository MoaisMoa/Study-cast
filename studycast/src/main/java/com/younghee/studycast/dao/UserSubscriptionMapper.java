package com.younghee.studycast.dao;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.UserSubscriptionDTO;

@Mapper
public interface UserSubscriptionMapper {

    int insertSubscription(UserSubscriptionDTO subscription);

    UserSubscriptionDTO findActiveByUserUuid(@Param("userUuid") UUID userUuid);

    int updateStatus(
        @Param("subscriptionId") Long subscriptionId,
        @Param("status") String status,
        @Param("cancelledAt") LocalDateTime cancelledAt
    );

    int updateNextBillingAt(
        @Param("subscriptionId") Long subscriptionId,
        @Param("nextBillingAt") LocalDateTime nextBillingAt
    );

    List<UserSubscriptionDTO> findDueBillings();
}
