package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "加入购物车请求参数")
public class CartDTO {

    @NotNull(message = "SKU不能为空")
    @Schema(description = "要加入购物车的 SKU ID", example = "10", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long skuId;

    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量至少为1")
    @Schema(description = "购买数量", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer quantity;
}
