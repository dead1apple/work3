package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "平台处理售后工单请求")
public class AfterSaleResolveRequest {
    @NotBlank(message = "处理结果不能为空")
    @Size(max = 500, message = "处理结果不能超过 500 个字符")
    @Schema(description = "平台最终处理意见", example = "平台介入后同意用户退款")
    private String result;
}
