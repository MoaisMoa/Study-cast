package com.younghee.studycast.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.younghee.studycast.dao")
public class MyBatisConfig {
    
}
