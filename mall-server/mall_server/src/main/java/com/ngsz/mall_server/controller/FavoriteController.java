package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "07. 收藏", description = "用户对商品的收藏管理")
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired private FavoriteService favoriteService;

    @Operation(summary = "我的收藏列表", description = "返回当前用户收藏的所有商品")
    @GetMapping
    public Result<?> list() {
        return Result.success(favoriteService.listByUserId(StpUtil.getLoginIdAsLong()));
    }

    @Operation(summary = "添加收藏", description = "收藏指定商品（已收藏则忽略）")
    @PostMapping("/{productId}")
    public Result<?> add(
            @Parameter(description = "商品 ID", example = "100") @PathVariable Long productId) {
        favoriteService.addFavorite(StpUtil.getLoginIdAsLong(), productId);
        return Result.success("收藏成功");
    }

    @Operation(summary = "取消收藏", description = "取消对指定商品的收藏")
    @DeleteMapping("/{productId}")
    public Result<?> remove(
            @Parameter(description = "商品 ID", example = "100") @PathVariable Long productId) {
        favoriteService.removeFavorite(StpUtil.getLoginIdAsLong(), productId);
        return Result.success("已取消收藏");
    }

    @Operation(summary = "是否已收藏", description = "用于商品详情页爱心按钮的初始状态")
    @GetMapping("/check/{productId}")
    public Result<?> check(
            @Parameter(description = "商品 ID", example = "100") @PathVariable Long productId) {
        return Result.success(favoriteService.isFavorite(StpUtil.getLoginIdAsLong(), productId));
    }
}
