package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MerchantCouponRequest {

    @NotBlank(message = "优惠券名称不能为空")
    @Size(max = 100, message = "优惠券名称不能超过 100 个字符")
    private String name;

    @NotNull(message = "优惠券类型不能为空")
    @Min(value = 1, message = "优惠券类型不正确")
    @Max(value = 3, message = "优惠券类型不正确")
    private Integer type;

    @NotNull(message = "优惠额度不能为空")
    @DecimalMin(value = "0.01", message = "优惠额度必须大于 0")
    @Digits(integer = 10, fraction = 2, message = "优惠额度最多保留两位小数")
    private BigDecimal amount;

    @NotNull(message = "使用门槛不能为空")
    @DecimalMin(value = "0.00", message = "使用门槛不能小于 0")
    @Digits(integer = 10, fraction = 2, message = "使用门槛最多保留两位小数")
    private BigDecimal minAmount;

    @NotNull(message = "发行总量不能为空")
    @Min(value = 1, message = "发行总量必须大于 0")
    private Integer totalCount;

    @NotNull(message = "生效时间不能为空")
    private LocalDateTime startTime;

    @NotNull(message = "失效时间不能为空")
    private LocalDateTime endTime;

    private LocalDateTime receiveStartTime;

    private LocalDateTime receiveEndTime;

    private LocalDateTime useStartTime;

    private LocalDateTime useEndTime;

    @Min(value = 1, message = "每人限领数量必须大于 0")
    private Integer perUserLimit;

    @DecimalMin(value = "0.01", message = "折扣券最高优惠金额必须大于 0")
    @Digits(integer = 10, fraction = 2, message = "折扣券最高优惠金额最多保留两位小数")
    private BigDecimal maxDiscountAmount;

    @NotNull(message = "优惠券状态不能为空")
    @Min(value = 0, message = "优惠券状态只能是 0 或 1")
    @Max(value = 1, message = "优惠券状态只能是 0 或 1")
    private Integer status;
}
