package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "平台售后退款请求")
public class AfterSaleRefundRequest {
    @NotNull(message = "退款金额不能为空")
    @DecimalMin(value = "0", inclusive = false, message = "退款金额必须大于 0")
    @Digits(integer = 10, fraction = 2, message = "退款金额整数最多 10 位且最多保留 2 位小数")
    @Schema(description = "退款金额，不能超过当前订单剩余可退款金额", example = "99.90")
    private BigDecimal amount;

    @NotBlank(message = "退款原因不能为空")
    @Size(max = 500, message = "退款原因不能超过 500 个字符")
    @Schema(description = "退款原因", example = "商品存在质量问题，同意原路退款")
    private String reason;
}
