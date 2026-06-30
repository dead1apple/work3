package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Schema(description = "商家发布/修改商品请求参数")
public class ProductDTO {

    @Schema(description = "商品 ID，新增时不传，修改时必传", example = "1")
    private Long id;

    @Schema(description = "分类 ID", example = "10")
    private Long categoryId;

    @Schema(description = "品牌 ID", example = "5")
    private Long brandId;

    @Schema(description = "商品名称", example = "华为 Mate 70 Pro")
    private String name;

    @Schema(description = "商品副标题/宣传语")
    private String subtitle;

    @Schema(description = "主图 URL")
    private String mainImage;

    @Schema(description = "商品图片 URL 列表")
    private List<String> images;

    @Schema(description = "商品详情（富文本 HTML）")
    private String detail;

    @Schema(description = "状态：0 下架，1 上架，2 待审核", example = "1")
    private Integer status;

    @Schema(description = "SKU 列表（至少一个）")
    private List<SkuDTO> skuList;
}
