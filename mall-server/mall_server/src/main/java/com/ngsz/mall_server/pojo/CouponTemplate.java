package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "优惠券模板（由管理员/商家创建）")
public class CouponTemplate {

    @Schema(description = "优惠券模板 ID", example = "1")
    private Long id;

    @Schema(description = "所属店铺 ID，null 表示平台券", example = "100")
    private Long shopId;

    @Schema(description = "优惠券名称", example = "满 300 减 30")
    private String name;

    @Schema(description = "券类型：1 满减，2 折扣，3 无门槛", example = "1")
    private Integer type;

    @Schema(description = "优惠金额（满减/无门槛，单位：元）或折扣值（折扣，单位：百分数，例如 85 表示 8.5 折）", example = "30.00")
    private BigDecimal amount;

    @Schema(description = "使用门槛金额（满减专用，折扣/无门槛可为 0）", example = "300.00")
    private BigDecimal minAmount;

    @Schema(description = "发行总量", example = "1000")
    private Integer totalCount;

    @Schema(description = "已领取数量", example = "100")
    private Integer issuedCount;

    @Schema(description = "已使用数量", example = "20")
    private Integer usedCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "生效时间", example = "2026-07-01 00:00:00")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "失效时间", example = "2026-07-31 23:59:59")
    private LocalDateTime endTime;

    @Schema(description = "状态：0 关闭，1 启用", example = "1")
    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}
