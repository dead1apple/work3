package com.ngsz.mall_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MallServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MallServerApplication.class, args);
    }

}
