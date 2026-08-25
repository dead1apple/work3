package com.ngsz.mall_server.common.exception;

import cn.dev33.satoken.exception.NotLoginException;
import com.ngsz.mall_server.common.result.Result;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    @Test
    void notLoggedInReturnsClearBusinessMessage() {
        NotLoginException exception = NotLoginException.newInstance(
                "default-login", "-1", NotLoginException.NOT_TOKEN, "Authorization");

        Result<?> result = new GlobalExceptionHandler().handleNotLoginException(
                exception, new MockHttpServletRequest());

        assertThat(result.getCode()).isEqualTo(-1);
        assertThat(result.getMsg()).isEqualTo("请先登录");
    }
}
