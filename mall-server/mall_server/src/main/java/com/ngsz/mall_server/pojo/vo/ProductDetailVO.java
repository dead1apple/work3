package com.ngsz.mall_server.pojo.vo;

import com.ngsz.mall_server.pojo.Product;
import com.ngsz.mall_server.pojo.Sku;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "商品详情")
public class ProductDetailVO {

    @Schema(description = "商品基础信息")
    private Product product;

    @Schema(description = "商品的完整 SKU 列表")
    private List<Sku> skuList;
}
