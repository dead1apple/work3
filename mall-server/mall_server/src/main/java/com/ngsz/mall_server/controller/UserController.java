package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.User;
import com.ngsz.mall_server.pojo.vo.ImageUploadVO;
import com.ngsz.mall_server.service.ImageStorageService;
import com.ngsz.mall_server.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "11. 用户中心", description = "当前登录用户个人资料、退出登录")
@RestController
@RequestMapping("/api/user")
@SecurityRequirement(name = "Authorization")
public class UserController {

    private final UserService userService;
    private final ImageStorageService imageStorageService;

    public UserController(UserService userService, ImageStorageService imageStorageService) {
        this.userService = userService;
        this.imageStorageService = imageStorageService;
    }

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

    @Operation(summary = "上传并修改我的头像", description = "普通用户可上传 JPEG、PNG、GIF 或 WebP 图片，最大 10 MB")
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<ImageUploadVO> updateAvatar(
            @Parameter(description = "头像图片", required = true) @RequestPart("file") MultipartFile file) {
        long userId = StpUtil.getLoginIdAsLong();
        ImageUploadVO uploaded = imageStorageService.store(file);
        String avatarUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(uploaded.getUrl()).build().toUriString();
        uploaded.setUrl(avatarUrl);
        userService.updateAvatar(userId, avatarUrl);
        return Result.success("头像修改成功", uploaded);
    }

    @Operation(summary = "退出登录", description = "注销当前 token")
    @PostMapping("/logout")
    public Result<?> logout() {
        StpUtil.logout();
        return Result.success("已退出登录");
    }
}
