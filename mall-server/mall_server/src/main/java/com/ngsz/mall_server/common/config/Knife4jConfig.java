package com.ngsz.mall_server.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class Knife4jConfig {

    @Bean
    public OpenAPI mallServerOpenAPI() {
        return new OpenAPI()
                .components(new Components().addSecuritySchemes("Authorization",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("Authorization")
                                .description("登录接口返回的 token，无需 Bearer 前缀")))
                .info(new Info()
                        .title("仿京东商城 - 后端接口文档")
                        .description("mall-server 前后端分离商城后端提供的 REST 接口，" +
                                "包含用户端、商家端、管理员端三大模块，使用 Sa-Token 做登录鉴权。")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ngsz")
                                .email("ngsz@example.com"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")));
    }
}
