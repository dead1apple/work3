package com.ngsz.mall_server.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册 Sa-Token 拦截器，校验规则为 StpUtil.checkLogin()
        registry.addInterceptor(new SaInterceptor(handle -> {
            // 不做全局登录校验，各Controller自行判断
        })).addPathPatterns("/api/**")
           .excludePathPatterns(
               "/api/auth/**",
               "/api/products/**",
               "/api/categories/**",
               "/api/brands/**",
               "/api/search/**",
               "/api/seckill/list",
               "/doc.html",
               "/swagger-ui/**",
               "/v3/api-docs/**"
           );
    }
}
