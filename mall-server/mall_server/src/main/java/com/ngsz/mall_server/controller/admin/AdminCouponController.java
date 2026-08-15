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

    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(contentService.listCoupons(keyword, status, page, size));
    }

    @PostMapping
    public Result<?> create(@Valid @RequestBody AdminCouponRequest request) {
        return Result.success("优惠券创建成功", contentService.createCoupon(request));
    }

    @PutMapping("/{id}")
    public Result<?> update(
            @PathVariable Long id, @Valid @RequestBody AdminCouponRequest request) {
        contentService.updateCoupon(id, request);
        return Result.success("优惠券更新成功");
    }

    @PutMapping("/{id}/status")
    public Result<?> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        contentService.updateCouponStatus(id, status);
        return Result.success("优惠券状态更新成功");
    }

    @Operation(summary = "查询可发放的优惠券", description = "管理员视角查询所有可用的优惠券模板（不分店铺）")
    @GetMapping("/available")
    public Result<?> available() {
        return Result.success(couponService.listAvailable(null));
    }
}
