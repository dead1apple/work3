package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "立即购买（不走购物车）请求参数")
public class BuyNowDTO {

    @NotNull(message = "SKU不能为空")
    @Schema(description = "SKU ID", example = "10", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long skuId;

    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量至少为1")
    @Schema(description = "购买数量", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer quantity;

    @NotNull(message = "请选择收货地址")
    @Schema(description = "收货地址 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long addressId;

    @Schema(description = "订单备注（可选）", example = "请尽快发货")
    private String remark;
}
