package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class SystemConfigRequest {

    @NotNull(message = "短信模拟开关不能为空")
    private Boolean smsMockEnabled;

    @NotNull(message = "支付模拟开关不能为空")
    private Boolean payMockEnabled;

    @NotNull(message = "推荐商品不能为空")
    private List<@Positive(message = "推荐商品 ID 必须大于 0") Long> recommendedProductIds;
}
