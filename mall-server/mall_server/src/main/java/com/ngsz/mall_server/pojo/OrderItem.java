package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "订单明细（每条对应一个 SKU）")
public class OrderItem {

    @Schema(description = "订单明细 ID", example = "1")
    private Long id;

    @Schema(description = "所属订单 ID", example = "1")
    private Long orderId;

    @Schema(description = "订单号", example = "202606300001")
    private String orderNo;

    @Schema(description = "SKU ID", example = "10")
    private Long skuId;

    @Schema(description = "商品 ID", example = "1")
    private Long productId;

    @Schema(description = "下单时商品名称（快照）", example = "华为 Mate 70 Pro")
    private String productName;

    @Schema(description = "下单时 SKU 名称（快照）", example = "12+256 曜石黑")
    private String skuName;

    @Schema(description = "下单时 SKU 图片（快照）")
    private String skuImage;

    @Schema(description = "下单时单价（元）", example = "6999.00")
    private BigDecimal price;

    @Schema(description = "购买数量", example = "1")
    private Integer quantity;

    @Schema(description = "小计金额（元，单价 × 数量）", example = "6999.00")
    private BigDecimal totalAmount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}
