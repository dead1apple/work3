package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.AdminPlatformService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminPlatformService adminPlatformService;

    public AdminDashboardController(AdminPlatformService adminPlatformService) {
        this.adminPlatformService = adminPlatformService;
    }

    @GetMapping
    public Result<?> dashboard(@RequestParam(defaultValue = "30") Integer days) {
        return Result.success(adminPlatformService.dashboard(days));
    }
}
