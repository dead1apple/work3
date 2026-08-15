package com.ngsz.mall_server.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.UserMapper;
import com.ngsz.mall_server.pojo.User;
import com.ngsz.mall_server.pojo.dto.LoginDTO;
import com.ngsz.mall_server.pojo.dto.RegisterDTO;
import com.ngsz.mall_server.service.UserService;
import com.ngsz.mall_server.service.SystemConfigService;
import com.ngsz.mall_server.service.VerificationCodeStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class UserServiceImpl implements UserService {
    @Autowired private UserMapper userMapper;
    @Autowired private VerificationCodeStore verificationCodeStore;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private SystemConfigService systemConfigService;
    @Value("${mall.sms.mock:true}") private boolean smsMock;

    @Override
    public Map<String, Object> login(LoginDTO dto, String ip) {
        String username = dto == null ? null : dto.getUsername();
        if (username == null || username.isBlank()) {
            recordLoginLog(null, username, ip, false, "用户名不能为空");
            throw new BusinessException("用户名不能为空");
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            recordLoginLog(null, username, ip, false, "密码不能为空");
            throw new BusinessException("密码不能为空");
        }
        User user = userMapper.findByUsername(dto.getUsername());
        if (user == null) {
            recordLoginLog(null, dto.getUsername(), ip, false, "用户名或密码错误");
            throw new BusinessException("用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            recordLoginLog(user.getId(), user.getUsername(), ip, false, "账号已被禁用");
            throw new BusinessException("账号已被禁用");
        }
        if (!BCrypt.checkpw(dto.getPassword(), user.getPassword())) {
            recordLoginLog(user.getId(), user.getUsername(), ip, false, "用户名或密码错误");
            throw new BusinessException("用户名或密码错误");
        }
        StpUtil.login(user.getId());
        String token = StpUtil.getTokenValue();
        user.setLastLoginTime(LocalDateTime.now());
        user.setLastLoginIp(ip);
        userMapper.updateLoginInfo(user);
        recordLoginLog(user.getId(), user.getUsername(), ip, true, "登录成功");
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        user.setPassword(null);
        result.put("user", user);
        return result;
    }

    private void recordLoginLog(
            Long userId, String username, String ip, boolean success, String message) {
        try {
            jdbcTemplate.update("""
                    INSERT INTO login_log (user_id, username, ip, success, message, create_time)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, userId, username == null ? "" : username, ip, success, message);
        } catch (Exception exception) {
            log.warn("登录日志写入失败: userId={}, username={}, success={}",
                    userId, username, success, exception);
        }
    }

    @Override
    public void register(RegisterDTO dto) {
        String cacheCode = verificationCodeStore.get(dto.getPhone());
        if (cacheCode == null) throw new BusinessException("验证码已过期，请重新获取");
        if (!cacheCode.equals(dto.getCode())) throw new BusinessException("验证码错误");
        if (userMapper.findByUsername(dto.getUsername()) != null) throw new BusinessException("用户名已存在");
        if (userMapper.findByPhone(dto.getPhone()) != null) throw new BusinessException("该手机号已注册");
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(BCrypt.hashpw(dto.getPassword()));
        user.setPhone(dto.getPhone());
        user.setNickname(dto.getNickname() != null ? dto.getNickname() : "用户" + dto.getPhone().substring(7));
        user.setEmail(dto.getEmail());
        user.setRole(0);
        user.setStatus(1);
        user.setGender(0);
        userMapper.insert(user);
        verificationCodeStore.delete(dto.getPhone());
    }

    @Override
    public String sendVerifyCode(String phone) {
        if (verificationCodeStore.isLocked(phone)) throw new BusinessException("验证码发送过于频繁，请稍后再试");
        String code = String.format("%06d", (int) (Math.random() * 1000000));
        verificationCodeStore.save(phone, code);
        log.info("【模拟短信】手机号: {} 验证码: {}", phone, code);
        return systemConfigService.isSmsMockEnabled(smsMock) ? code : null;
    }

    @Override
    public User getUserInfo(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        user.setPassword(null);
        return user;
    }

    @Override
    public void updateUserInfo(User user) {
        user.setPassword(null);
        userMapper.update(user);
    }

    @Override
    public PageResult<User> listUsers(String keyword, Integer role, Integer status, Integer page, Integer size) {
        List<User> all = userMapper.findByCondition(keyword, role, status);
        int total = all.size();
        int from = (page - 1) * size;
        int to = Math.min(from + size, total);
        List<User> list = from < total ? all.subList(from, to) : List.of();
        list.forEach(u -> u.setPassword(null));
        return new PageResult<>((long) total, list, page, size);
    }

    @Override
    public void updateUserStatus(Long userId, Integer status) {
        User user = userMapper.findById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        user.setStatus(status);
        userMapper.update(user);
    }
}
