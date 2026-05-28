package com.younghee.studycast.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.younghee.studycast.dao.EmailVerificationMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class VerificationCleanupScheduler {
    
    private final EmailVerificationMapper emailVerificationMapper;

    // 확장2) 매일 새별 3시에 만료/사용된 인증번호 정리
    @Scheduled(cron= "0 0 3 * * *")
    public void cleanupExpiredOrUsedCodes() {
        int deletedCount = emailVerificationMapper.deleteExpriedOrUsedCodes();

        if (deletedCount > 0) {
            log.info("만료/사용된 이메일 인증번호 정리 완료: {}건 삭제", deletedCount);
        }
    }
}
