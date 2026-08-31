package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "创建售后工单请求")
public class CreateAfterSaleRequest {
    @NotNull(message = "订单明细不能为空")
    @Schema(description = "订单商品明细 ID", example = "4", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long orderItemId;

    @NotBlank(message = "售后类型不能为空")
    @Schema(description = "售后类型：REFUND、RETURN_REFUND、EXCHANGE、RESEND", example = "REFUND")
    private String type;

    @NotBlank(message = "问题类型不能为空")
    @Schema(description = "问题类型：QUALITY、DAMAGED、WRONG_OR_MISSING、LOGISTICS、OTHER", example = "QUALITY")
    private String reasonType;

    @NotBlank(message = "问题描述不能为空")
    @Size(max = 1000, message = "问题描述不能超过 1000 个字符")
    private String description;

    @Valid
    @Size(max = 9, message = "单个工单最多上传 9 个附件")
    private List<AttachmentRequest> attachments = new ArrayList<>();

    @Data
    @Schema(description = "OSS 附件引用")
    public static class AttachmentRequest {
        @NotBlank(message = "附件 URL 不能为空")
        private String url;
        @NotBlank(message = "附件 ObjectKey 不能为空")
        private String objectKey;
        @Size(max = 255, message = "附件文件名不能超过 255 个字符")
        private String fileName;
        @Positive(message = "附件大小必须大于 0")
        private Long fileSize;
    }
}
