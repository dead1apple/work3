package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AdminRefundOrderRequest {

    @NotNull(message = "退款金额不能为空")
    @DecimalMin(value = "0", inclusive = false, message = "退款金额必须大于 0")
    @Digits(integer = 10, fraction = 2, message = "退款金额整数最多10位且最多保留2位小数")
    private BigDecimal amount;

    @NotBlank(message = "退款原因不能为空")
    private String reason;
}
