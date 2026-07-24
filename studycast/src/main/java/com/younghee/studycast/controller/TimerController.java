package com.younghee.studycast.controller;

import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;

// 멤버별 누적 공부 타이머 실시간 공유 (영속화 없이 방 전체에 브로드캐스트만)
@Controller
@RequiredArgsConstructor
public class TimerController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/timer/update")
    public void handleTimerUpdate(TimerUpdateRequest request) {
        messagingTemplate.convertAndSend(
            "/sub/room/" + request.getRoomNo() + "/timer",
            Map.of(
                "userUuid", request.getUserUuid(),
                "totalSeconds", request.getTotalSeconds(),
                "running", request.isRunning()
            )
        );
    }

    @Data
    public static class TimerUpdateRequest {
        private Long roomNo;
        private String userUuid;
        private int totalSeconds;
        // 지금 이 순간 타이머 실행 중인지(시작 버튼 눌렀는지) — 다른 참여자 화면의 LIVE 뱃지 판정용
        private boolean running;
    }
}
