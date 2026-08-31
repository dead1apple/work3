package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.AfterSaleTicket;
import com.ngsz.mall_server.pojo.dto.AfterSaleActionRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleAttachmentRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleMessageRequest;
import com.ngsz.mall_server.pojo.dto.CreateAfterSaleRequest;
import com.ngsz.mall_server.service.AfterSaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "09. 售后工单", description = "用户提交和跟进自己的售后工单")
@RestController
@RequestMapping("/api/after-sales")
@SecurityRequirement(name = "Authorization")
public class AfterSaleController {
    private final AfterSaleService afterSaleService;

    public AfterSaleController(AfterSaleService afterSaleService) {
        this.afterSaleService = afterSaleService;
    }

    @Operation(summary = "创建售后工单", description = "只允许对属于当前用户且状态为待发货、待收货或已完成的订单商品申请售后")
    @PostMapping
    public Result<?> create(@Valid @RequestBody CreateAfterSaleRequest request) {
        afterSaleService.create(StpUtil.getLoginIdAsLong(), request);
        return Result.success("售后工单创建成功");
    }

    @Operation(summary = "查询我的售后工单")
    @GetMapping
    public Result<PageResult<AfterSaleTicket>> list(
            @Parameter(description = "工单状态：0待商家处理，1商家处理中，2待补充材料，3待用户确认，4平台处理中，5已解决，6已关闭，7已拒绝，8已取消")
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return Result.success(afterSaleService.listMine(StpUtil.getLoginIdAsLong(), status, page, size));
    }

    @Operation(summary = "售后工单详情")
    @GetMapping("/{ticketNo}")
    public Result<Map<String, Object>> detail(@Parameter(description = "售后工单号", example = "AS1234567890ABCDEF")
                                               @PathVariable String ticketNo) {
        return Result.success(afterSaleService.detailForUser(StpUtil.getLoginIdAsLong(), ticketNo));
    }

    @Operation(summary = "提交工单留言")
    @PostMapping("/{ticketNo}/messages")
    public Result<?> message(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleMessageRequest request) {
        afterSaleService.addUserMessage(StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("留言成功");
    }

    @Operation(summary = "补充售后工单附件", description = "用户向自己的未关闭售后工单追加 OSS 图片附件，单个工单最多 9 个附件")
    @PostMapping("/{ticketNo}/attachments")
    public Result<?> attachments(@PathVariable String ticketNo,
                                 @Valid @RequestBody AfterSaleAttachmentRequest request) {
        afterSaleService.addUserAttachments(StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("附件补充成功");
    }

    @Operation(summary = "申请平台介入", description = "商家拒绝售后申请后，用户可以申请平台介入")
    @PostMapping("/{ticketNo}/platform")
    public Result<?> platform(@PathVariable String ticketNo, @Valid @RequestBody AfterSaleActionRequest request) {
        afterSaleService.requestPlatform(StpUtil.getLoginIdAsLong(), ticketNo, request);
        return Result.success("平台介入申请已提交");
    }

    @Operation(summary = "取消售后工单", description = "仅允许取消待商家处理或待补充材料的工单")
    @PutMapping("/{ticketNo}/cancel")
    public Result<?> cancel(@PathVariable String ticketNo) {
        afterSaleService.cancel(StpUtil.getLoginIdAsLong(), ticketNo);
        return Result.success("售后工单已取消");
    }

    @Operation(summary = "确认售后处理结果")
    @PutMapping("/{ticketNo}/confirm")
    public Result<?> confirm(@PathVariable String ticketNo) {
        afterSaleService.confirm(StpUtil.getLoginIdAsLong(), ticketNo);
        return Result.success("工单已关闭");
    }
}
