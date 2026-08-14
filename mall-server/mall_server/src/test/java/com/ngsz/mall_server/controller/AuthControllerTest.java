package com.ngsz.mall_server.controller;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.common.utils.RedisUtils;
import com.ngsz.mall_server.pojo.dto.SendCodeDTO;
import com.ngsz.mall_server.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private RedisUtils redisUtils;

    @InjectMocks
    private AuthController authController;

    @Test
    void sendCodeReturnsCodeAndExpiryInMockMode() {
        SendCodeDTO dto = new SendCodeDTO();
        dto.setPhone("13800138000");
        when(userService.sendVerifyCode(dto.getPhone())).thenReturn("123456");

        Result<?> result = authController.sendCode(dto);

        assertThat(result.getCode()).isEqualTo(1);
        assertThat(result.getMsg()).isEqualTo("验证码已发送");
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertThat(data.get("mock")).isEqualTo(true);
        assertThat(data.get("code")).isEqualTo("123456");
        assertThat(data.get("expiresIn")).isEqualTo(300);
    }
}
