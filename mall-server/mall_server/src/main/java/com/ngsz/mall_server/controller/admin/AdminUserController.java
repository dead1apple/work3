package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "16. 管理员-用户", description = "管理员对用户的查询与启停")
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    @Autowired private UserService userService;

    @Operation(summary = "分页查询用户", description = "管理员分页查询用户，可按用户名关键字、角色、状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "用户名关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "角色：0 普通用户，1 商家，2 管理员") @RequestParam(required = false) Integer role,
            @Parameter(description = "状态：0 禁用，1 正常") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(userService.listUsers(keyword, role, status, page, size));
    }

    @Operation(summary = "启停用户", description = "启用或禁用用户账号")
    @PutMapping("/{id}/status")
    public Result<?> updateStatus(
            @Parameter(description = "用户 ID", example = "1") @PathVariable Long id,
            @Parameter(description = "目标状态：0 禁用，1 启用", example = "0") @RequestParam Integer status) {
        userService.updateUserStatus(id, status);
        return Result.success("操作成功");
    }
}
