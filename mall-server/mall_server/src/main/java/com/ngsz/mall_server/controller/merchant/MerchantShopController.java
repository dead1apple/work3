package com.ngsz.mall_server.controller.merchant;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.Shop;
import com.ngsz.mall_server.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "19. 商家-店铺", description = "商家入驻申请、店铺信息查看与修改")
@RestController
@RequestMapping("/api/merchant/shop")
public class MerchantShopController {

    @Autowired private ShopService shopService;

    @Operation(summary = "查询我的店铺", description = "返回当前登录用户作为店主的店铺信息；未申请则返回 null")
    @GetMapping
    public Result<?> info() {
        return Result.success(shopService.getByUserId(StpUtil.getLoginIdAsLong()));
    }

    @Operation(summary = "提交店铺入驻申请", description = "提交店铺信息和营业执照图片，状态变为待审核")
    @PostMapping("/apply")
    public Result<?> apply(@RequestBody Shop shop) {
        shopService.applyShop(StpUtil.getLoginIdAsLong(), shop);
        return Result.success("申请已提交，等待审核");
    }

    @Operation(summary = "修改店铺信息", description = "只能修改当前用户作为店主的店铺")
    @PutMapping
    public Result<?> update(@RequestBody Shop shop) {
        shopService.updateShop(StpUtil.getLoginIdAsLong(), shop);
        return Result.success("修改成功");
    }
}
