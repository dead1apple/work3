package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "商品 SKU（最小库存单位）")
public class Sku {

    @Schema(description = "SKU ID", example = "1")
    private Long id;

    @Schema(description = "所属商品 ID", example = "1")
    private Long productId;

    @Schema(description = "SKU 名称", example = "华为 Mate 70 Pro 12+256 曜石黑")
    private String skuName;

    @Schema(description = "规格值，JSON 字符串", example = "{\"颜色\":\"曜石黑\",\"内存\":\"12+256\"}")
    private String specValues;

    @Schema(description = "销售价（元）", example = "6999.00")
    private BigDecimal price;

    @Schema(description = "市场价/划线价（元）", example = "7999.00")
    private BigDecimal marketPrice;

    @Schema(description = "成本价（元，商家端用）")
    private BigDecimal costPrice;

    @Schema(description = "可用库存", example = "100")
    private Integer stock;

    @Schema(description = "已锁定库存（待支付/未释放）", example = "5")
    private Integer lockedStock;

    @Schema(description = "SKU 图片 URL")
    private String image;

    @Schema(description = "SKU 编码")
    private String skuCode;

    @Schema(description = "重量（kg），用于计算运费", example = "0.22")
    private BigDecimal weight;

    @Schema(description = "状态：0 禁用，1 启用", example = "1")
    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "逻辑删除标记：0 未删，1 已删", hidden = true)
    private Integer deleted;
}
