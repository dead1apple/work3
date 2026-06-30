package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.User;
import com.ngsz.mall_server.pojo.dto.LoginDTO;
import com.ngsz.mall_server.pojo.dto.RegisterDTO;
import java.util.Map;

public interface UserService {
    Map<String, Object> login(LoginDTO dto, String ip);
    void register(RegisterDTO dto);
    void sendVerifyCode(String phone);
    User getUserInfo(Long userId);
    void updateUserInfo(User user);
    PageResult<User> listUsers(String keyword, Integer role, Integer status, Integer page, Integer size);
    void updateUserStatus(Long userId, Integer status);
}
