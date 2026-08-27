package com.ngsz.mall_server.controller.merchant;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.Shop;
import com.ngsz.mall_server.pojo.dto.MerchantCouponRequest;
import com.ngsz.mall_server.service.CouponService;
import com.ngsz.mall_server.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "20. 商家-优惠券", description = "商家仅管理自己店铺的优惠券模板")
@RestController
@RequestMapping("/api/merchant/coupons")
public class MerchantCouponController {

    private final CouponService couponService;
    private final ShopService shopService;

    public MerchantCouponController(CouponService couponService, ShopService shopService) {
        this.couponService = couponService;
        this.shopService = shopService;
    }

    @Operation(summary = "查询本店优惠券")
    @GetMapping
    public Result<?> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(couponService.listMerchantCoupons(
                requireActiveShop().getId(), keyword, status, page, size));
    }

    @Operation(summary = "创建本店优惠券")
    @PostMapping
    public Result<?> create(@Valid @RequestBody MerchantCouponRequest request) {
        return Result.success("优惠券创建成功",
                couponService.createMerchantCoupon(requireActiveShop().getId(), request));
    }

    @Operation(summary = "删除本店未领取的优惠券")
    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        couponService.deleteMerchantCoupon(requireActiveShop().getId(), id);
        return Result.success("优惠券删除成功");
    }

    @Operation(summary = "查询本店优惠券详情")
    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Long id) {
        return Result.success(couponService.getMerchantCoupon(requireActiveShop().getId(), id));
    }

    @Operation(summary = "更新本店未被领取的优惠券")
    @PutMapping("/{id}")
    public Result<?> update(
            @Parameter(description = "优惠券模板 ID", example = "1") @PathVariable Long id,
            @Valid @RequestBody MerchantCouponRequest request) {
        couponService.updateMerchantCoupon(requireActiveShop().getId(), id, request);
        return Result.success("优惠券更新成功");
    }

    @Operation(summary = "启用或停用本店优惠券")
    @PutMapping("/{id}/status")
    public Result<?> updateStatus(
            @Parameter(description = "优惠券模板 ID", example = "1") @PathVariable Long id,
            @RequestParam Integer status) {
        couponService.updateMerchantCouponStatus(requireActiveShop().getId(), id, status);
        return Result.success("优惠券状态更新成功");
    }

    @Operation(summary = "查询本店优惠券统计")
    @GetMapping("/{id}/statistics")
    public Result<?> statistics(@PathVariable Long id) {
        return Result.success(couponService.merchantCouponStatistics(requireActiveShop().getId(), id));
    }

    @Operation(summary = "查询本店优惠券领取与核销明细")
    @GetMapping("/{id}/users")
    public Result<?> users(@PathVariable Long id) {
        return Result.success(couponService.listMerchantCouponUsers(requireActiveShop().getId(), id));
    }

    private Shop requireActiveShop() {
        Shop shop = shopService.getByUserId(StpUtil.getLoginIdAsLong());
        if (shop == null) {
            throw new BusinessException("您还没有店铺");
        }
        if (shop.getStatus() == null || shop.getStatus() != 1) {
            throw new BusinessException("店铺未处于营业状态，不能管理优惠券");
        }
        return shop;
    }
}
