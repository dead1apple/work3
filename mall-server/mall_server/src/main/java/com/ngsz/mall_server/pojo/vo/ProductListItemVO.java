package com.ngsz.mall_server.pojo.vo;

import com.ngsz.mall_server.pojo.Product;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "商品分页列表项")
public class ProductListItemVO {

    @Schema(description = "商品基础信息")
    private Product product;

    @Schema(description = "SKU 最低售价，无 SKU 时为 0", example = "6999.00")
    private BigDecimal minPrice;

    @Schema(description = "SKU 最高售价，无 SKU 时为 0", example = "7999.00")
    private BigDecimal maxPrice;

    @Schema(description = "所有 SKU 的库存合计", example = "100")
    private Integer totalStock;
}
