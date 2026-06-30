package com.ngsz.mall_server.common.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.ngsz.mall_server.mapper")
public class MyBatisPlusConfig {
}
