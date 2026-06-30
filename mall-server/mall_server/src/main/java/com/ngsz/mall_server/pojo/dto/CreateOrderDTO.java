package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
@Schema(description = "购物车结算创建订单请求参数")
public class CreateOrderDTO {

    @NotEmpty(message = "请选择商品")
    @Schema(description = "要结算的购物车条目 ID 列表", example = "[1, 2]", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Long> cartIds;

    @NotNull(message = "请选择收货地址")
    @Schema(description = "收货地址 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long addressId;

    @Schema(description = "使用的用户优惠券 ID（可选，不使用不传）", example = "5")
    private Long couponId;

    @Schema(description = "订单备注（可选）", example = "请尽快发货")
    private String remark;
}
