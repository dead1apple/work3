package com.ngsz.mall_server.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.context.SaHolder;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册 Sa-Token 拦截器，校验规则为 StpUtil.checkLogin()
        registry.addInterceptor(new SaInterceptor(handle -> {
                    // CORS preflight requests do not carry the admin token. They
                    // must reach Spring's CORS handler before authentication.
                    if (SaHolder.getRequest().isMethod("OPTIONS")) {
                        return;
                    }
                    StpUtil.checkLogin();
                })
                ).addPathPatterns("/api/**")
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
