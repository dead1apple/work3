package com.ngsz.mall_server.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.UserMapper;
import com.ngsz.mall_server.pojo.User;
import com.ngsz.mall_server.pojo.dto.LoginDTO;
import com.ngsz.mall_server.service.SystemConfigService;
import com.ngsz.mall_server.service.VerificationCodeStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private VerificationCodeStore verificationCodeStore;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private SystemConfigService systemConfigService;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "smsMock", true);
    }

    @Test
    void returnsGeneratedCodeWhenSmsMockIsEnabled() {
        String phone = "13800138000";
        when(verificationCodeStore.isLocked(phone)).thenReturn(false);
        when(systemConfigService.isSmsMockEnabled(true)).thenReturn(true);

        String code = userService.sendVerifyCode(phone);

        assertThat(code).matches("\\d{6}");
        verify(verificationCodeStore).save(phone, code);
    }

    @Test
    void hidesGeneratedCodeWhenSmsMockIsDisabledAtRuntime() {
        String phone = "13800138001";
        when(verificationCodeStore.isLocked(phone)).thenReturn(false);
        when(systemConfigService.isSmsMockEnabled(true)).thenReturn(false);

        String code = userService.sendVerifyCode(phone);

        assertThat(code).isNull();
        verify(verificationCodeStore).save(eq(phone), anyString());
    }

    @Test
    void recordsSuccessfulLoginWithoutPassword() {
        LoginDTO dto = loginDto("admin", "secret");
        User user = enabledUser(7L, "admin", "secret");
        when(userMapper.findByUsername("admin")).thenReturn(user);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getTokenValue).thenReturn("token-7");

            Map<String, Object> result = userService.login(dto, "127.0.0.1");

            assertThat(result.get("token")).isEqualTo("token-7");
        }

        verify(jdbcTemplate).update(
                contains("INSERT INTO login_log"),
                eq(7L), eq("admin"), eq("127.0.0.1"), eq(true), eq("登录成功"));
    }

    @Test
    void recordsUnknownUserLoginFailure() {
        LoginDTO dto = loginDto("missing", "not-logged");
        when(userMapper.findByUsername("missing")).thenReturn(null);

        assertThatThrownBy(() -> userService.login(dto, "127.0.0.2"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("用户名或密码错误");
        verify(jdbcTemplate).update(
                contains("INSERT INTO login_log"),
                isNull(), eq("missing"), eq("127.0.0.2"), eq(false), eq("用户名或密码错误"));
    }

    @Test
    void recordsDisabledUserLoginFailure() {
        LoginDTO dto = loginDto("disabled", "secret");
        User user = enabledUser(9L, "disabled", "secret");
        user.setStatus(0);
        when(userMapper.findByUsername("disabled")).thenReturn(user);

        assertThatThrownBy(() -> userService.login(dto, "127.0.0.3"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("账号已被禁用");
        verify(jdbcTemplate).update(
                contains("INSERT INTO login_log"),
                eq(9L), eq("disabled"), eq("127.0.0.3"), eq(false), eq("账号已被禁用"));
    }

    @Test
    void recordsWrongPasswordLoginFailure() {
        LoginDTO dto = loginDto("admin", "wrong-password");
        User user = enabledUser(7L, "admin", "secret");
        when(userMapper.findByUsername("admin")).thenReturn(user);

        assertThatThrownBy(() -> userService.login(dto, "127.0.0.4"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("用户名或密码错误");
        verify(jdbcTemplate).update(
                contains("INSERT INTO login_log"),
                eq(7L), eq("admin"), eq("127.0.0.4"), eq(false), eq("用户名或密码错误"));
    }

    @Test
    void recordsBlankUsernameValidationFailure() {
        LoginDTO dto = loginDto("   ", "secret");

        assertThatThrownBy(() -> userService.login(dto, "127.0.0.6"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("用户名不能为空");
        verify(jdbcTemplate).update(
                contains("INSERT INTO login_log"),
                isNull(), eq("   "), eq("127.0.0.6"), eq(false), eq("用户名不能为空"));
    }

    @Test
    void recordsBlankPasswordValidationFailure() {
        LoginDTO dto = loginDto("admin", "   ");

        assertThatThrownBy(() -> userService.login(dto, "127.0.0.7"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("密码不能为空");
        verify(jdbcTemplate).update(
                contains("INSERT INTO login_log"),
                isNull(), eq("admin"), eq("127.0.0.7"), eq(false), eq("密码不能为空"));
    }

    @Test
    void loginLogFailureDoesNotBlockSuccessfulLogin() {
        LoginDTO dto = loginDto("admin", "secret");
        User user = enabledUser(7L, "admin", "secret");
        when(userMapper.findByUsername("admin")).thenReturn(user);
        doThrow(new DataAccessResourceFailureException("login log database unavailable"))
                .when(jdbcTemplate).update(anyString(), any(Object[].class));

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getTokenValue).thenReturn("still-issued");

            Map<String, Object> result = userService.login(dto, "127.0.0.5");

            assertThat(result.get("token")).isEqualTo("still-issued");
            stp.verify(() -> StpUtil.login(7L));
        }
    }

    private static LoginDTO loginDto(String username, String password) {
        LoginDTO dto = new LoginDTO();
        dto.setUsername(username);
        dto.setPassword(password);
        return dto;
    }

    private static User enabledUser(Long id, String username, String password) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPassword(cn.hutool.crypto.digest.BCrypt.hashpw(password));
        user.setStatus(1);
        user.setRole(2);
        return user;
    }
}
