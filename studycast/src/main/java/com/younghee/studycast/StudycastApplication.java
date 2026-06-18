package com.younghee.studycast;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.younghee.studycast.config.LiveKitProperties;

@SpringBootApplication
@EnableScheduling
// @Scheduled 스케줄러 실행을 위함
@EnableConfigurationProperties(LiveKitProperties.class)
// LiveKitProperties 설정 클래스를 Spring Bean으로 등록해서 Service에서 주입받을 수 있게 함.
public class StudycastApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudycastApplication.class, args);
	}

}
