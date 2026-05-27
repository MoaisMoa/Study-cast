package com.younghee.studycast.config;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import com.younghee.studycast.dao.RoomMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.security.JwtProvider;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;
    private final UserMapper userMapper;
    private final RoomMapper roomMapper;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = getAuthorizationHeader(accessor);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
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
                    }
                }
            }
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Principal principal = accessor.getUser();
            String destination = accessor.getDestination();
            if (principal != null && destination != null && destination.startsWith("/sub/rooms/")) {
                try {
                    Long roomNo = Long.valueOf(destination.substring("/sub/rooms/".length()));
                    UUID userUuid = UUID.fromString(principal.getName());
                    if (!roomMapper.existsParticipant(userUuid, roomNo)) {
                        return null;
                    }
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
        }

        return message;
    }

    private String getAuthorizationHeader(StompHeaderAccessor accessor) {
        var nativeHeaders = accessor.toNativeHeaderMap();
        if (nativeHeaders == null) {
            return null;
        }
        var values = nativeHeaders.get("Authorization");
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.get(0);
    }
}
