package com.ngsz.mall_server.pojo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderCouponSnapshot {
    private Long id;
    private Long orderId;
    private String orderNo;
    private Long userCouponId;
    private Long couponTemplateId;
    private Long shopId;
    private String couponName;
    private Integer couponType;
    private BigDecimal couponAmount;
    private BigDecimal minAmount;
    private BigDecimal goodsAmount;
    private BigDecimal discountAmount;
    private BigDecimal payAmount;
    private LocalDateTime createTime;
}
