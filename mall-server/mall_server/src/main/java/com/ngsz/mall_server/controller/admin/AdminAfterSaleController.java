package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.AfterSaleTicket;
import com.ngsz.mall_server.pojo.dto.AfterSaleActionRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleMessageRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleResolveRequest;
import com.ngsz.mall_server.service.AfterSaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "15. 管理员-售后工单", description = "管理员处理平台介入的售后工单")
@RestController
@RequestMapping("/api/admin/after-sales")
@SecurityRequirement(name = "Authorization")
public class AdminAfterSaleController {
    private final AfterSaleService afterSaleService;

    public AdminAfterSaleController(AfterSaleService afterSaleService) {
        this.afterSaleService = afterSaleService;
    }

    @Operation(summary = "查询平台售后工单")
    @GetMapping
    public Result<PageResult<AfterSaleTicket>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(afterSaleService.listForPlatform(status, page, size));
    }

    @Operation(summary = "查询平台售后工单详情")
    @GetMapping("/{ticketNo}")
    public Result<Map<String, Object>> detail(@Parameter(description = "售后工单号") @PathVariable String ticketNo) {
        return Result.success(afterSaleService.detailForPlatform(ticketNo));
    }

    @Operation(summary = "官方客服留言")
    @PostMapping("/{ticketNo}/messages")
    public Result<?> message(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleMessageRequest request) {
        afterSaleService.addPlatformMessage(StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("留言成功");
    }

    @Operation(summary = "平台处理售后工单", description = "只记录平台处理结果，不直接修改订单金额")
    @PutMapping("/{ticketNo}/resolve")
    public Result<?> resolve(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleResolveRequest request) {
        afterSaleService.resolve(StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("平台处理完成，等待用户确认");
    }

    @Operation(summary = "平台关闭售后工单")
    @PutMapping("/{ticketNo}/close")
    public Result<?> close(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleActionRequest request) {
        afterSaleService.closeByPlatform(StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("工单已关闭");
    }
}
