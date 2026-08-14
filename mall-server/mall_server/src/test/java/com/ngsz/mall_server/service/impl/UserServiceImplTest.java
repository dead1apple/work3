package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.utils.RedisUtils;
import com.ngsz.mall_server.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private RedisUtils redisUtils;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "smsMock", true);
    }

    @Test
    void returnsGeneratedCodeWhenSmsMockIsEnabled() {
        String phone = "13800138000";
        when(redisUtils.exists("sms:lock:" + phone)).thenReturn(false);

        String code = userService.sendVerifyCode(phone);

        assertThat(code).matches("\\d{6}");
        verify(redisUtils).set("sms:code:" + phone, code, 300);
        verify(redisUtils).set("sms:lock:" + phone, "1", 60);
    }
}
