package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.PayService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "09. 支付", description = "订单的支付创建、确认、状态查询（当前为 mock 支付）")
@RestController
@RequestMapping("/api/pay")
public class PayController {

    @Autowired private PayService payService;

    @Operation(summary = "创建支付单", description = "为指定订单创建支付单（mock 模式直接返回支付单号）")
    @PostMapping("/create")
    public Result<?> create(
            @Parameter(description = "订单号", example = "202606300001") @RequestParam String orderNo,
            @Parameter(description = "支付方式：1 微信，2 支付宝，3 余额", example = "1")
            @RequestParam(defaultValue = "1") Integer payType) {
        return Result.success(payService.createPayment(orderNo, payType, StpUtil.getLoginIdAsLong()));
    }

    @Operation(summary = "确认支付（mock）", description = "将支付单状态置为已支付，仅在 mock 模式下使用")
    @PostMapping("/confirm")
    public Result<?> confirm(
            @Parameter(description = "支付单号", example = "PAY202606300001") @RequestParam String paymentNo) {
        payService.confirmPayment(paymentNo, StpUtil.getLoginIdAsLong());
        return Result.success("支付成功");
    }

    @Operation(summary = "查询订单的支付状态", description = "根据订单号查询该订单最近一次支付的状态")
    @GetMapping("/status")
    public Result<?> status(
            @Parameter(description = "订单号", example = "202606300001") @RequestParam String orderNo) {
        return Result.success(payService.getPaymentStatus(orderNo));
    }
}
