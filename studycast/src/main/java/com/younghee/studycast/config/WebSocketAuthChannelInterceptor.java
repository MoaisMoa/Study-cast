package com.younghee.studycast.config;

import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import com.younghee.studycast.dao.RoomParticipantsMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.security.JwtProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    // 채팅("/sub/chat/room/{roomNo}")과 멤버 이벤트("/sub/room/{roomNo}/members") 구독 모두 매칭
    private static final Pattern ROOM_DESTINATION_PATTERN =
        Pattern.compile("^/sub/(?:chat/)?room/(\\d+)(?:/.*)?$");

    private final JwtProvider jwtProvider;
    private final UserMapper userMapper;
    // 죽은 코드였던 RoomMapper.existsParticipant를 대체 — 참여 이력이 아닌 active 참여자만 인정
    private final RoomParticipantsMapper roomParticipantsMapper;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            log.warn("preSend: accessor is null");
            return message;
        }

        StompCommand command = accessor.getCommand();
        log.info("STOMP {} received", command);

        if (StompCommand.CONNECT.equals(command)) {
            String authHeader = getAuthorizationHeader(accessor);
            log.info("CONNECT: authHeaderPresent={}", authHeader != null);
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    if (jwtProvider.validateToken(token)) {
                        UUID userUuid = jwtProvider.getUserUuid(token);
                        UserDTO user = userMapper.findByUuid(userUuid);
                        if (user != null && "ACTIVE".equals(user.getUserStatus())) {
                            Principal principal = new UsernamePasswordAuthenticationToken(
                                userUuid.toString(),
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER"))
                            );
                            accessor.setUser(principal);
                            log.info("[STOMP CONNECT SUCCESS] userUuid={}, email={}", userUuid, user.getUserEmail());
                        } else {
                            log.warn("[STOMP CONNECT FAILED] user is null or inactive. userUuid={}", userUuid);
                        }
                    } else {
                        log.warn("[STOMP CONNECT FAILED] invalid JWT token");
                    }
                } catch (Exception e) {
                    log.error("[STOMP CONNECT ERROR] token validation failed: ", e);
                }
            } else {
                log.warn("[STOMP CONNECT FAILED] missing or malformed Authorization header");
            }
        }

        if (StompCommand.SUBSCRIBE.equals(command)) {
            Principal principal = accessor.getUser();
            String destination = accessor.getDestination();
            log.info("SUBSCRIBE: destination={}, principal={}", destination, principal == null ? null : principal.getName());
            // 기존엔 "/sub/rooms/" prefix만 검사해서 실제 구독 경로(/sub/chat/room/, /sub/room/)와 안 맞아 이 가드가 한 번도 실행되지 않았음 — 정규식으로 두 destination 모두 매칭
            Matcher roomMatcher = (destination == null) ? null : ROOM_DESTINATION_PATTERN.matcher(destination);
            if (roomMatcher != null && roomMatcher.matches()) {
                if (principal == null) {
                    log.warn("SUBSCRIBE denied: unauthenticated user");
                    return null;
                }
                try {
                    Long roomNo = Long.valueOf(roomMatcher.group(1));
                    UUID userUuid = UUID.fromString(principal.getName());
                    // 단순 참여 기록(existsParticipant) 대신 active 상태만 인정 — 방을 나간 유저는 구독 거부
                    if (!roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)) {
                        log.warn("SUBSCRIBE denied: user is not participant. room={} userUuid={}", roomNo, userUuid);
                        return null;
                    }
                    log.info("SUBSCRIBE success: room={} userUuid={}", roomNo, userUuid);
                } catch (NumberFormatException e) {
                    log.warn("SUBSCRIBE: invalid room number");
                    return null;
                }
            }
        }

        if (StompCommand.SEND.equals(command)) {
            Principal principal = accessor.getUser();
            String destination = accessor.getDestination();
            log.info("SEND: destination={}, principal={}", destination, principal == null ? null : principal.getName());
            if (destination != null && destination.startsWith("/pub/")) {
                if (principal == null) {
                    log.warn("SEND denied: unauthenticated user. destination={}", destination);
                    return null;
                }
                log.info("SEND success: destination={} userUuid={}", destination, principal.getName());
            }
        }

        return message;
    }

    private String getAuthorizationHeader(StompHeaderAccessor accessor) {
        // 방법 1: getFirstNativeHeader 사용 (권장)
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header != null) {
            log.debug("Found Authorization header via getFirstNativeHeader: {}", 
                header.substring(0, Math.min(20, header.length())) + "...");
            return header;
        }

        // 방법 2: toNativeHeaderMap 대체
        var nativeHeaders = accessor.toNativeHeaderMap();
        if (nativeHeaders != null) {
            for (var entry : nativeHeaders.entrySet()) {
                if (entry.getKey() != null && entry.getKey().equalsIgnoreCase("Authorization")) {
                    var values = entry.getValue();
                    if (values != null && !values.isEmpty()) {
                        log.debug("Found Authorization header via toNativeHeaderMap");
                        return values.get(0);
                    }
                }
            }
        }

        log.warn("No Authorization header found in STOMP CONNECT frame");
        return null;
    }
}
