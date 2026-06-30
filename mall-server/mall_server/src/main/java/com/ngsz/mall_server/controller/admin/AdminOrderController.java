package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "13. 管理员-订单", description = "管理员端订单查询")
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    @Autowired private OrderService orderService;

    @Operation(summary = "分页查询全部订单", description = "管理员查看平台所有订单，支持关键字和状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "订单号/收货人关键字", example = "202606300001") @RequestParam(required = false) String keyword,
            @Parameter(description = "订单状态", example = "1") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(orderService.listOrders(keyword, status, null, page, size));
    }
}
