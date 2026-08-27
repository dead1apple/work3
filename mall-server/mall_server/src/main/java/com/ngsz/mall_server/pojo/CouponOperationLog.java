package com.ngsz.mall_server.pojo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CouponOperationLog {
    private Long id;
    private Long couponTemplateId;
    private Long userCouponId;
    private Long userId;
    private String orderNo;
    private String operationType;
    private String operatorType;
    private Long operatorId;
    private String reason;
    private String detail;
    private LocalDateTime createTime;
}
