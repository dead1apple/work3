package com.ngsz.mall_server.controller;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.SendCodeDTO;
import com.ngsz.mall_server.pojo.dto.LoginDTO;
import com.ngsz.mall_server.service.UserService;
import com.ngsz.mall_server.service.VerificationCodeStore;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private VerificationCodeStore verificationCodeStore;

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

    @Test
    void loginValidationIsHandledByServiceSoFailuresCanBeLogged() throws Exception {
        Method login = AuthController.class.getMethod(
                "login", LoginDTO.class, HttpServletRequest.class);
        Annotation[] dtoAnnotations = login.getParameterAnnotations()[0];

        boolean hasValid = Arrays.stream(dtoAnnotations)
                .anyMatch(annotation -> annotation.annotationType() == Valid.class);

        assertThat(hasValid).isFalse();
    }
}
