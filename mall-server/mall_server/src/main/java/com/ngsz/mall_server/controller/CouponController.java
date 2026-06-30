package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "06. 优惠券", description = "用户端优惠券的领取、查询、可用券列表")
@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired private CouponService couponService;

    @Operation(summary = "可领取的优惠券列表",
            description = "查询当前店铺下（不传则查询平台券）当前可领取的优惠券模板")
    @GetMapping("/available")
    public Result<?> available(
            @Parameter(description = "店铺 ID，不传则查询平台券", example = "100")
            @RequestParam(required = false) Long shopId) {
        return Result.success(couponService.listAvailable(shopId));
    }

    @Operation(summary = "领取优惠券", description = "用户从优惠券模板领取一张券到自己的账户")
    @PostMapping("/claim/{templateId}")
    public Result<?> claim(
            @Parameter(description = "优惠券模板 ID", example = "1") @PathVariable Long templateId) {
        couponService.claimCoupon(StpUtil.getLoginIdAsLong(), templateId);
        return Result.success("领取成功");
    }

    @Operation(summary = "我的优惠券",
            description = "查询当前登录用户已领取的优惠券；不传 status 返回全部，可按状态过滤：0 未使用 1 已使用 2 已过期")
    @GetMapping("/mine")
    public Result<?> mine(
            @Parameter(description = "状态：0 未使用，1 已使用，2 已过期", example = "0")
            @RequestParam(required = false) Integer status) {
        return Result.success(couponService.listMyCoupons(StpUtil.getLoginIdAsLong(), status));
    }
}
