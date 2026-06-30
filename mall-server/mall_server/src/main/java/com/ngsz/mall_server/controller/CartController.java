package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.CartDTO;
import com.ngsz.mall_server.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "04. 购物车", description = "当前登录用户的购物车管理")
@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired private CartService cartService;

    @Operation(summary = "查询我的购物车", description = "返回当前登录用户购物车中的所有条目")
    @GetMapping
    public Result<?> list() {
        return Result.success(cartService.listCartItems(StpUtil.getLoginIdAsLong()));
    }

    @Operation(summary = "加入购物车", description = "将指定 SKU 加入购物车，若已存在则数量累加")
    @PostMapping
    public Result<?> add(@Valid @RequestBody CartDTO dto) {
        cartService.addToCart(StpUtil.getLoginIdAsLong(), dto);
        return Result.success("已加入购物车");
    }

    @Operation(summary = "修改购物车数量", description = "修改某条购物车记录的购买数量")
    @PutMapping("/{id}/quantity")
    public Result<?> updateQuantity(
            @Parameter(description = "购物车条目 ID", example = "1") @PathVariable Long id,
            @Parameter(description = "新的购买数量", example = "2") @RequestParam Integer quantity) {
        cartService.updateQuantity(StpUtil.getLoginIdAsLong(), id, quantity);
        return Result.success("修改成功");
    }

    @Operation(summary = "勾选/取消勾选购物车条目", description = "用于结算前勾选要购买的商品")
    @PutMapping("/{id}/selected")
    public Result<?> updateSelected(
            @Parameter(description = "购物车条目 ID", example = "1") @PathVariable Long id,
            @Parameter(description = "1 勾选，0 取消", example = "1") @RequestParam Integer selected) {
        cartService.updateSelected(StpUtil.getLoginIdAsLong(), id, selected);
        return Result.success("修改成功");
    }

    @Operation(summary = "全选/全不选购物车", description = "一键切换当前用户购物车所有条目的勾选状态")
    @PutMapping("/select-all")
    public Result<?> selectAll(
            @Parameter(description = "1 全选，0 全不选", example = "1") @RequestParam Integer selected) {
        cartService.selectAll(StpUtil.getLoginIdAsLong(), selected);
        return Result.success("修改成功");
    }

    @Operation(summary = "删除购物车条目", description = "从购物车中移除某条记录")
    @DeleteMapping("/{id}")
    public Result<?> remove(@Parameter(description = "购物车条目 ID", example = "1") @PathVariable Long id) {
        cartService.removeFromCart(StpUtil.getLoginIdAsLong(), id);
        return Result.success("删除成功");
    }
}
