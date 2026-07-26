package com.younghee.studycast.controller;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.younghee.studycast.service.RoomAccessGuard;

import lombok.Data;
import lombok.RequiredArgsConstructor;

// 멤버별 누적 공부 타이머 실시간 공유 (영속화 없이 방 전체에 브로드캐스트만)
@Controller
@RequiredArgsConstructor
public class TimerController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomAccessGuard roomAccessGuard;

    // 발신자 신원은 클라이언트가 보낸 값이 아니라, CONNECT 시점에 JWT로 검증된 Principal에서만 가져온다
    // (그래야 로그인한 사용자가 다른 사람의 UUID를 실어 보내 위장하는 것을 막을 수 있음)
    @MessageMapping("/timer/update")
    public void handleTimerUpdate(TimerUpdateRequest request, Principal principal) {
        UUID userUuid = UUID.fromString(principal.getName());
        // 로그인만 되어 있으면 임의의 roomNo로 타이머 이벤트를 주입할 수 있던 취약점 방지 —
        // 실제로 이 방의 active 참여자인지 검증
        roomAccessGuard.requireActiveParticipant(request.getRoomNo(), userUuid);
        messagingTemplate.convertAndSend(
            "/sub/room/" + request.getRoomNo() + "/timer",
            Map.of(
                "userUuid", principal.getName(),
                "totalSeconds", request.getTotalSeconds(),
                "running", request.isRunning()
            )
        );
    }

    @Data
    public static class TimerUpdateRequest {
        private Long roomNo;
        private int totalSeconds;
        // 지금 이 순간 타이머 실행 중인지(시작 버튼 눌렀는지) — 다른 참여자 화면의 LIVE 뱃지 판정용
        private boolean running;
    }
}
