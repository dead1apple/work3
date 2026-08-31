package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "售后工单留言请求")
public class AfterSaleMessageRequest {
    @NotBlank(message = "留言内容不能为空")
    @Size(max = 1000, message = "留言内容不能超过 1000 个字符")
    @Schema(description = "留言内容", example = "请提供商品破损照片")
    private String content;
}
