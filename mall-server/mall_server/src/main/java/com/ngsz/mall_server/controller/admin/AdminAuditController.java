package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.AdminBatchAuditRequest;
import com.ngsz.mall_server.service.AdminPlatformService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audits")
public class AdminAuditController {

    private final AdminPlatformService adminPlatformService;

    public AdminAuditController(AdminPlatformService adminPlatformService) {
        this.adminPlatformService = adminPlatformService;
    }

    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(adminPlatformService.listAudits(type, keyword, page, size));
    }

    @GetMapping("/history")
    public Result<?> history(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(adminPlatformService.listAuditHistory(type, page, size));
    }

    @PostMapping("/batch")
    public Result<?> batch(@Valid @RequestBody AdminBatchAuditRequest request) {
        adminPlatformService.batchAudit(StpUtil.getLoginIdAsLong(), request);
        return Result.success("审核完成");
    }
}
