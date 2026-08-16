package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.BuyNowDTO;
import com.ngsz.mall_server.pojo.dto.CreateOrderDTO;
import com.ngsz.mall_server.pojo.dto.ReviewDTO;
import com.ngsz.mall_server.service.OrderService;
import com.ngsz.mall_server.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "08. 订单", description = "用户下单、订单管理、收货、评价等")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired private OrderService orderService;
    @Autowired private ReviewService reviewService;

    @Operation(summary = "购物车结算下单", description = "从购物车中选择条目结算生成订单，可使用优惠券")
    @PostMapping
    public Result<?> create(@Valid @RequestBody CreateOrderDTO dto) {
        return Result.success(orderService.createOrder(StpUtil.getLoginIdAsLong(), dto));
    }

    @Operation(summary = "立即购买下单", description = "从商品详情页直接购买（不走购物车）")
    @PostMapping("/buy-now")
    public Result<?> buyNow(@Valid @RequestBody BuyNowDTO dto) {
        return Result.success(orderService.buyNow(StpUtil.getLoginIdAsLong(), dto));
    }

    @Operation(summary = "分页查询我的订单", description = "分页查询当前用户的订单，可按状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "订单状态：0 待付款，1 待发货，2 待收货，3 已完成，4 已取消，5 已退款")
            @RequestParam(required = false) Integer status,
            @Parameter(description = "页码，从 1 开始", example = "1")
            @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(orderService.listUserOrders(StpUtil.getLoginIdAsLong(), status, page, size));
    }

    @Operation(summary = "订单详情", description = "根据订单号查询订单详细信息以及明细")
    @GetMapping("/{orderNo}")
    public Result<?> detail(@Parameter(description = "订单号", example = "202606300001") @PathVariable String orderNo) {
        return Result.success(orderService.getOrderDetail(StpUtil.getLoginIdAsLong(), orderNo));
    }

    @Operation(summary = "取消订单", description = "取消待付款的订单")
    @PutMapping("/{orderNo}/cancel")
    public Result<?> cancel(@Parameter(description = "订单号", example = "202606300001") @PathVariable String orderNo) {
        orderService.cancelOrder(StpUtil.getLoginIdAsLong(), orderNo);
        return Result.success("订单已取消");
    }

    @Operation(summary = "确认收货", description = "将待收货订单标记为已完成")
    @PutMapping("/{orderNo}/receive")
    public Result<?> receive(@Parameter(description = "订单号", example = "202606300001") @PathVariable String orderNo) {
        orderService.confirmReceive(StpUtil.getLoginIdAsLong(), orderNo);
        return Result.success("已确认收货");
    }

    @Operation(summary = "删除订单", description = "逻辑删除订单（仅自己可见的订单）")
    @DeleteMapping("/{orderNo}")
    public Result<?> delete(@Parameter(description = "订单号", example = "202606300001") @PathVariable String orderNo) {
        orderService.deleteOrder(StpUtil.getLoginIdAsLong(), orderNo);
        return Result.success("删除成功");
    }

    @Operation(summary = "发表评价", description = "对已完成的订单明细进行评价")
    @PostMapping("/review")
    public Result<?> review(@Valid @RequestBody ReviewDTO dto) {
        reviewService.addReview(StpUtil.getLoginIdAsLong(), dto);
        return Result.success("评价成功");
    }
}
