package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "商家发货请求参数")
public class DeliverDTO {

    @NotBlank(message = "订单号不能为空")
    @Schema(description = "要发货的订单号", example = "202606300001", requiredMode = Schema.RequiredMode.REQUIRED)
    private String orderNo;

    @NotBlank(message = "物流单号不能为空")
    @Schema(description = "物流单号", example = "SF1234567890", requiredMode = Schema.RequiredMode.REQUIRED)
    private String logisticsNo;

    @NotBlank(message = "物流公司不能为空")
    @Schema(description = "物流公司名称", example = "顺丰快递", requiredMode = Schema.RequiredMode.REQUIRED)
    private String logisticsCompany;
}
