package com.younghee.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.younghee.dao")
public class MyBatisConfig {
    
}
