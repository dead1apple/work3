package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.AdminCouponRequest;
import com.ngsz.mall_server.service.AdminContentService;
import com.ngsz.mall_server.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "12. 管理员-优惠券", description = "管理员端优惠券模板管理")
@RestController
@RequestMapping("/api/admin/coupons")
public class AdminCouponController {

    private final CouponService couponService;
    private final AdminContentService contentService;

    public AdminCouponController(CouponService couponService, AdminContentService contentService) {
        this.couponService = couponService;
        this.contentService = contentService;
    }

    @Operation(summary = "分页查询优惠券模板")
    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(contentService.listCoupons(keyword, status, page, size));
    }

    @Operation(summary = "创建优惠券模板")
    @PostMapping
    public Result<?> create(@Valid @RequestBody AdminCouponRequest request) {
        return Result.success("优惠券创建成功", contentService.createCoupon(request));
    }

    @Operation(summary = "更新优惠券模板")
    @PutMapping("/{id}")
    public Result<?> update(
            @PathVariable Long id, @Valid @RequestBody AdminCouponRequest request) {
        contentService.updateCoupon(id, request);
        return Result.success("优惠券更新成功");
    }

    @Operation(summary = "启用或停用优惠券模板")
    @PutMapping("/{id}/status")
    public Result<?> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        contentService.updateCouponStatus(id, status);
        return Result.success("优惠券状态更新成功");
    }

    @Operation(summary = "查询可发放的优惠券", description = "管理员视角查询所有可用的优惠券模板（不分店铺）")
    @GetMapping("/available")
    public Result<?> available() {
        return Result.success(couponService.listAllAvailable());
    }

    @Operation(summary = "优惠券详情")
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Long id) {
        return Result.success(couponService.getCoupon(id));
    }

    @Operation(summary = "优惠券操作流水")
    @GetMapping("/{id}/operations")
    public Result<?> operations(@PathVariable Long id) {
        return Result.success(couponService.listCouponOperations(id));
    }

    @Operation(summary = "优惠券统计")
    @GetMapping("/{id}/statistics")
    public Result<?> statistics(@PathVariable Long id) {
        return Result.success(couponService.couponStatistics(id));
    }
}
