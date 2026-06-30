package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "商品（SPU）")
public class Product {

    @Schema(description = "商品 ID", example = "1")
    private Long id;

    @Schema(description = "分类 ID", example = "10")
    private Long categoryId;

    @Schema(description = "品牌 ID", example = "5")
    private Long brandId;

    @Schema(description = "所属店铺 ID", example = "100")
    private Long shopId;

    @Schema(description = "商品名称", example = "华为 Mate 70 Pro")
    private String name;

    @Schema(description = "商品副标题/宣传语")
    private String subtitle;

    @Schema(description = "主图 URL")
    private String mainImage;

    @Schema(description = "商品图片列表，逗号分隔的 URL 字符串")
    private String images;

    @Schema(description = "商品详情（富文本 HTML）")
    private String detail;

    @Schema(description = "状态：0 下架，1 上架，2 待审核", example = "1")
    private Integer status;

    @Schema(description = "累计销量", example = "0")
    private Integer salesCount;

    @Schema(description = "排序值，数字越小越靠前", example = "10")
    private Integer sortOrder;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "逻辑删除标记：0 未删，1 已删", hidden = true)
    private Integer deleted;
}
