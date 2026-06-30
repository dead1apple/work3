package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.User;
import com.ngsz.mall_server.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "11. 用户中心", description = "当前登录用户个人资料、退出登录")
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired private UserService userService;

    @Operation(summary = "获取我的资料", description = "返回当前登录用户的个人资料（不包含密码）")
    @GetMapping("/info")
    public Result<?> getUserInfo() {
        return Result.success(userService.getUserInfo(StpUtil.getLoginIdAsLong()));
    }

    @Operation(summary = "修改我的资料", description = "只更新请求体中非空字段；用户 ID 以后台会话为准")
    @PutMapping("/info")
    public Result<?> updateUserInfo(@RequestBody User user) {
        user.setId(StpUtil.getLoginIdAsLong());
        userService.updateUserInfo(user);
        return Result.success("修改成功");
    }

    @Operation(summary = "退出登录", description = "注销当前 token")
    @PostMapping("/logout")
    public Result<?> logout() {
        StpUtil.logout();
        return Result.success("已退出登录");
    }
}
