package com.ngsz.mall_server.controller;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.common.utils.RedisUtils;
import com.ngsz.mall_server.pojo.dto.LoginDTO;
import com.ngsz.mall_server.pojo.dto.RegisterDTO;
import com.ngsz.mall_server.pojo.dto.SendCodeDTO;
import com.ngsz.mall_server.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "01. 账号认证", description = "用户登录、注册、短信验证码等账号相关接口")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserService userService;
    @Autowired private RedisUtils redisUtils;

    @Operation(summary = "用户名密码登录",
            description = "使用用户名和密码登录，成功后返回 token（写入请求头 Authorization）以及用户基本信息")
    @PostMapping("/login")
    public Result<?> login(@Valid @RequestBody LoginDTO dto,
                           @Parameter(hidden = true) HttpServletRequest request) {
        Map<String, Object> data = userService.login(dto, request.getRemoteAddr());
        return Result.success(data);
    }

    @Operation(summary = "用户注册",
            description = "通过用户名、密码、手机号和短信验证码注册新账号")
    @PostMapping("/register")
    public Result<?> register(@Valid @RequestBody RegisterDTO dto) {
        userService.register(dto);
        return Result.success("注册成功");
    }

    @Operation(summary = "发送短信验证码",
            description = "向指定手机号发送注册/登录用的短信验证码，开发模式下可在响应或 mock 接口中查看验证码")
    @PostMapping("/send-code")
    public Result<?> sendCode(@Valid @RequestBody SendCodeDTO dto) {
        String code = userService.sendVerifyCode(dto.getPhone());
        if (code != null) {
            return Result.success("验证码已发送", Map.of(
                    "mock", true,
                    "code", code,
                    "expiresIn", 300
            ));
        }
        return Result.success("验证码已发送");
    }

    @Operation(summary = "获取短信验证码（仅 Mock）",
            description = "开发环境下用于查询已发送的短信验证码，方便联调，部署到生产前应移除")
    @GetMapping("/mock-code")
    public Result<?> getMockCode(@Parameter(description = "手机号", example = "13800138000") @RequestParam String phone) {
        String code = redisUtils.getString("sms:code:" + phone);
        return Result.success(code != null ? code : "验证码已过期");
    }
}
