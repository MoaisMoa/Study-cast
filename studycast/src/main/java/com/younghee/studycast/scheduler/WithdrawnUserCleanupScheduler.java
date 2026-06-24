package com.younghee.studycast.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.younghee.studycast.dao.UserMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class WithdrawnUserCleanupScheduler {

    private final UserMapper userMapper;

    // 매일 새벽 4시 — 탈퇴 후 30일 경과한 회원 완전 삭제
    @Scheduled(cron = "0 0 4 * * *")
    public void cleanupExpiredWithdrawnUsers() {
        int deletedCount = userMapper.deleteExpiredWithdrawnUsers();

        if (deletedCount > 0) {
            log.info("탈퇴 후 30일 경과 회원 삭제 완료: {}건 삭제", deletedCount);
        }
    }
}
