package com.younghee.studycast;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class StudycastApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudycastApplication.class, args);
	}

}
