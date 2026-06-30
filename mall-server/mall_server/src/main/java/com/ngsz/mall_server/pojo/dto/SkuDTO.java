package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Schema(description = "商品 SKU 信息（随商品一起提交）")
public class SkuDTO {

    @Schema(description = "SKU ID，新增时不传，修改时必传", example = "10")
    private Long id;

    @Schema(description = "SKU 名称", example = "12+256 曜石黑")
    private String skuName;

    @Schema(description = "规格值，JSON 字符串", example = "{\"颜色\":\"曜石黑\",\"内存\":\"12+256\"}")
    private String specValues;

    @Schema(description = "销售价（元）", example = "6999.00")
    private BigDecimal price;

    @Schema(description = "市场价/划线价（元）", example = "7999.00")
    private BigDecimal marketPrice;

    @Schema(description = "初始库存", example = "100")
    private Integer stock;

    @Schema(description = "SKU 图片 URL")
    private String image;
}
