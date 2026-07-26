package com.younghee.studycast.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.younghee.studycast.service.RoomService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class StaleParticipantCleanupScheduler {

    private final RoomService roomService;

    // 하트비트가 90초 이상 끊긴 참여자를 1분마다 정리 — 브라우저 강제종료 등으로
    // 퇴장 API가 유실됐을 때 유령 참여자가 영구히 남지 않도록 함
    private static final int STALE_SECONDS = 90;

    @Scheduled(fixedRate = 60_000)
    public void cleanupStaleParticipants() {
        roomService.cleanupStaleParticipants(STALE_SECONDS);
    }
}
