package com.younghee.studycast.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Component
@ConfigurationProperties(prefix = "study-room")
public class StudyRoomPolicyProperties {

    // 스터디방 최대 인원 제한
    private int maxUsersLimit = 4;

    // 스터디방 대표 이미지 정책
    private Image image = new Image();

    // properties와 매핑
    @Getter
    @Setter
    public static class Image {

        // 이미지 최대 용량
        private long maxSize = 5 * 1024 * 1024;

        // 이미지 저장 경로
        private String uploadDir = "uploads/rooms";

        // 허용 MIME 타입
        private List<String> allowedTypes =
            List.of("image/jpeg", "image/png");
    }
}
