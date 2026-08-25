package com.ngsz.mall_server.common.exception;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.common.security.AdminSecurityInterceptor;
import cn.dev33.satoken.exception.NotLoginException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e, HttpServletRequest request) {
        AdminSecurityInterceptor.markRequestFailed(request);
        log.error("业务异常: {}", e.getMessage());
        return Result.error(e.getMessage());
    }

    @ExceptionHandler(NotLoginException.class)
    public Result<?> handleNotLoginException(NotLoginException e, HttpServletRequest request) {
        AdminSecurityInterceptor.markRequestFailed(request);
        return Result.error("请先登录");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<?> handleValidException(
            MethodArgumentNotValidException e, HttpServletRequest request) {
        AdminSecurityInterceptor.markRequestFailed(request);
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数校验失败");
        return Result.error(message);
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e, HttpServletRequest request) {
        AdminSecurityInterceptor.markRequestFailed(request);
        log.error("系统异常: ", e);
        return Result.error("系统内部错误，请稍后重试");
    }
}
