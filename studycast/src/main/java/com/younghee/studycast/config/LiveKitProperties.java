package com.younghee.studycast.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "livekit")
// livekit.* 설정값 담는 클래스
public class LiveKitProperties {
    
    private String url;
    private String apiKey;
    private String apiSecret;
    private Integer tokenTtlMinutes = 120;
}
