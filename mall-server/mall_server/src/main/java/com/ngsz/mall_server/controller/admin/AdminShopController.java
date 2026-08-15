package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.AdminPlatformService;
import com.ngsz.mall_server.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "15. 管理员-店铺", description = "管理员对店铺的查询与审核")
@RestController
@RequestMapping("/api/admin/shops")
public class AdminShopController {

    @Autowired private ShopService shopService;
    @Autowired private AdminPlatformService adminPlatformService;

    @Operation(summary = "分页查询店铺", description = "管理员查看平台所有店铺，支持关键字和状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "店铺名称关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "店铺状态：0 待审核，1 营业中，2 禁用，3 拒绝") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(shopService.listShops(keyword, status, page, size));
    }

    @Operation(summary = "店铺地图点位", description = "返回全部店铺的位置信息用于地图展示")
    @GetMapping("/map")
    public Result<?> mapPoints() {
        return Result.success(adminPlatformService.listShopMapPoints());
    }

    @Operation(summary = "审核或管理店铺状态", description = "目标状态：1 通过/恢复，2 禁用，3 拒绝")
    @PutMapping("/{id}/audit")
    public Result<?> audit(
            @Parameter(description = "店铺 ID", example = "100") @PathVariable Long id,
            @Parameter(description = "目标状态：1 通过/恢复，2 禁用，3 拒绝", example = "1") @RequestParam Integer status) {
        adminPlatformService.updateShopStatus(StpUtil.getLoginIdAsLong(), id, status);
        return Result.success("操作完成");
    }

    @GetMapping("/{id}/detail")
    public Result<?> detail(@PathVariable Long id) {
        return Result.success(adminPlatformService.shopDetail(id));
    }
}
