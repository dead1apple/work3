package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "用户持有的优惠券实例")
public class UserCoupon {

    @Schema(description = "用户券 ID", example = "1")
    private Long id;

    @Schema(description = "所属用户 ID", example = "1")
    private Long userId;

    @Schema(description = "对应优惠券模板 ID", example = "1")
    private Long couponTemplateId;

    @Schema(description = "状态：0 未使用，1 已使用，2 已过期", example = "0")
    private Integer status;

    @Schema(description = "使用该券的订单号（未使用为 null）", example = "202606300001")
    private String orderNo;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "领取时间", example = "2026-06-30 10:00:00")
    private LocalDateTime receiveTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "使用时间（未使用为 null）")
    private LocalDateTime useTime;
}
