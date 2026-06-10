package com.younghee.studycast.config;

import java.nio.file.Path;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig  implements WebMvcConfigurer{
    
    private final StudyRoomPolicyProperties properties;

    public WebConfig(StudyRoomPolicyProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. properties에 설정된 실제 이미지 저장 폴더 경로 조회
        Path uploadDirectory = Path.of(
            properties.getImage().getUploadDir()
        ).toAbsolutePath().normalize();
        // 2. /room-images/** 요청을 실제 uploads/rooms 폴더와 연결
        registry
            .addResourceHandler("/room-images/**")
            .addResourceLocations(uploadDirectory.toUri().toString());
    }
}
