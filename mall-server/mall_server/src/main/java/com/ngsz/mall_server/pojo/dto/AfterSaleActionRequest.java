package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "售后工单处理请求")
public class AfterSaleActionRequest {
    @NotBlank(message = "处理原因不能为空")
    @Size(max = 500, message = "处理原因不能超过 500 个字符")
    @Schema(description = "处理原因或处理结果", example = "同意退款，请等待原路退回")
    private String reason;
}
