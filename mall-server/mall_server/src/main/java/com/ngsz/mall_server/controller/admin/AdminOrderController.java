package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.AdminCloseOrderRequest;
import com.ngsz.mall_server.pojo.dto.AdminDeliverRequest;
import com.ngsz.mall_server.pojo.dto.AdminRefundOrderRequest;
import com.ngsz.mall_server.service.AdminPlatformService;
import com.ngsz.mall_server.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "13. 管理员-订单", description = "管理员端订单查询")
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    @Autowired private OrderService orderService;
    @Autowired private AdminPlatformService adminPlatformService;

    @Operation(summary = "分页查询全部订单", description = "管理员查看平台所有订单，支持关键字和状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "订单号/收货人关键字", example = "202606300001") @RequestParam(required = false) String keyword,
            @Parameter(description = "订单状态", example = "1") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(orderService.listOrders(keyword, status, null, page, size));
    }

    @GetMapping("/{orderNo}/detail")
    public Result<?> detail(@PathVariable String orderNo) {
        return Result.success(adminPlatformService.orderDetail(orderNo));
    }

    @PutMapping("/{orderNo}/deliver")
    public Result<?> deliver(
            @PathVariable String orderNo,
            @Valid @RequestBody AdminDeliverRequest request) {
        adminPlatformService.deliverOrder(orderNo, request);
        return Result.success("发货成功");
    }

    @PutMapping("/{orderNo}/close")
    public Result<?> close(
            @PathVariable String orderNo,
            @Valid @RequestBody AdminCloseOrderRequest request) {
        adminPlatformService.closeOrder(orderNo, request);
        return Result.success("订单已关闭");
    }

    @PutMapping("/{orderNo}/refund")
    public Result<?> refund(
            @PathVariable String orderNo,
            @Valid @RequestBody AdminRefundOrderRequest request) {
        adminPlatformService.refundOrder(StpUtil.getLoginIdAsLong(), orderNo, request);
        return Result.success("退款完成");
    }
}
