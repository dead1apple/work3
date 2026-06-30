package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "12. 管理员-优惠券", description = "管理员端优惠券模板查询")
@RestController
@RequestMapping("/api/admin/coupons")
public class AdminCouponController {

    @Autowired private CouponService couponService;

    @Operation(summary = "查询可发放的优惠券", description = "管理员视角查询所有可用的优惠券模板（不分店铺）")
    @GetMapping("/available")
    public Result<?> available() {
        return Result.success(couponService.listAvailable(null));
    }
}
