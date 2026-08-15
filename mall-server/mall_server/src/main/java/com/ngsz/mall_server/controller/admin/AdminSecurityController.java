package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.common.security.AdminSecurityService;
import com.ngsz.mall_server.pojo.dto.AdminRoleRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/security")
public class AdminSecurityController {

    private final AdminSecurityService securityService;

    public AdminSecurityController(AdminSecurityService securityService) {
        this.securityService = securityService;
    }

    @GetMapping("/roles")
    public Result<?> listRoles() {
        return Result.success(securityService.listRoles());
    }

    @PostMapping("/roles")
    public Result<?> createRole(@Valid @RequestBody AdminRoleRequest request) {
        return Result.success("角色创建成功",
                securityService.createRole(StpUtil.getLoginIdAsLong(), request));
    }

    @PutMapping("/roles/{id}")
    public Result<?> updateRole(
            @PathVariable Long id, @Valid @RequestBody AdminRoleRequest request) {
        return Result.success("角色更新成功",
                securityService.updateRole(StpUtil.getLoginIdAsLong(), id, request));
    }

    @GetMapping("/admins")
    public Result<?> listAdmins() {
        return Result.success(securityService.listAdmins());
    }

    @PutMapping("/admins/{userId}/role")
    public Result<?> assignRole(
            @PathVariable Long userId, @RequestParam Long roleId) {
        securityService.assignRole(StpUtil.getLoginIdAsLong(), userId, roleId);
        return Result.success("管理员角色分配成功");
    }

    @GetMapping("/operation-logs")
    public Result<?> listOperationLogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword) {
        return Result.success(securityService.listOperationLogs(page, size, keyword));
    }

    @GetMapping("/login-logs")
    public Result<?> listLoginLogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean success) {
        return Result.success(securityService.listLoginLogs(page, size, keyword, success));
    }

    @GetMapping("/risks")
    public Result<?> listRisks() {
        return Result.success(securityService.listRisks());
    }
}
