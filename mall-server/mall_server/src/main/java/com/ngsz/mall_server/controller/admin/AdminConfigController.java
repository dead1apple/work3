package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.SystemConfigRequest;
import com.ngsz.mall_server.service.SystemConfigService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/config")
public class AdminConfigController {

    private final SystemConfigService systemConfigService;

    public AdminConfigController(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @GetMapping
    public Result<?> get() {
        return Result.success(systemConfigService.getConfig());
    }

    @PutMapping
    public Result<?> update(@Valid @RequestBody SystemConfigRequest request) {
        systemConfigService.updateConfig(request);
        return Result.success("系统配置更新成功");
    }
}
