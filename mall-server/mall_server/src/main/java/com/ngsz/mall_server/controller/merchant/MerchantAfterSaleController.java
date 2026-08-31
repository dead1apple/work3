package com.ngsz.mall_server.controller.merchant;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.AfterSaleTicket;
import com.ngsz.mall_server.pojo.dto.AfterSaleActionRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleMessageRequest;
import com.ngsz.mall_server.service.AfterSaleService;
import com.ngsz.mall_server.service.impl.MerchantAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "18. 商家-售后工单", description = "商家只能处理自己店铺的售后工单")
@RestController
@RequestMapping("/api/merchant/after-sales")
@SecurityRequirement(name = "Authorization")
public class MerchantAfterSaleController {
    private final AfterSaleService afterSaleService;
    private final MerchantAccessService merchantAccessService;

    public MerchantAfterSaleController(AfterSaleService afterSaleService, MerchantAccessService merchantAccessService) {
        this.afterSaleService = afterSaleService;
        this.merchantAccessService = merchantAccessService;
    }

    private Long shopId() {
        return merchantAccessService.requireActiveShop(StpUtil.getLoginIdAsLong());
    }

    @Operation(summary = "查询本店售后工单")
    @GetMapping
    public Result<PageResult<AfterSaleTicket>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(afterSaleService.listForMerchant(shopId(), status, page, size));
    }

    @Operation(summary = "查询本店售后工单详情")
    @GetMapping("/{ticketNo}")
    public Result<Map<String, Object>> detail(@Parameter(description = "售后工单号") @PathVariable String ticketNo) {
        return Result.success(afterSaleService.detailForMerchant(shopId(), ticketNo));
    }

    @Operation(summary = "商家回复售后工单")
    @PostMapping("/{ticketNo}/messages")
    public Result<?> message(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleMessageRequest request) {
        afterSaleService.addMerchantMessage(shopId(), StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("留言成功");
    }

    @Operation(summary = "同意售后申请", description = "仅推进工单状态，不直接执行退款；退款仍由现有退款业务处理")
    @PutMapping("/{ticketNo}/approve")
    public Result<?> approve(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleActionRequest request) {
        afterSaleService.approve(shopId(), StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("已同意售后申请");
    }

    @Operation(summary = "拒绝售后申请")
    @PutMapping("/{ticketNo}/reject")
    public Result<?> reject(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleActionRequest request) {
        afterSaleService.reject(shopId(), StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("已拒绝售后申请");
    }

    @Operation(summary = "要求用户补充材料")
    @PutMapping("/{ticketNo}/request-info")
    public Result<?> requestInfo(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleActionRequest request) {
        afterSaleService.requestInfo(shopId(), StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("已要求用户补充材料");
    }
}
