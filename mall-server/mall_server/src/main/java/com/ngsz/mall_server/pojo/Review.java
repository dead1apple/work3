package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "商品评价")
public class Review {

    @Schema(description = "评价 ID", example = "1")
    private Long id;

    @Schema(description = "评价人用户 ID", example = "1")
    private Long userId;

    @Schema(description = "对应订单明细 ID", example = "1")
    private Long orderItemId;

    @Schema(description = "被评价的商品 ID", example = "100")
    private Long productId;

    @Schema(description = "对应 SKU ID", example = "10")
    private Long skuId;

    @Schema(description = "评分：1~5 星", example = "5")
    private Integer rating;

    @Schema(description = "评价内容", example = "手机很棒，物流也快！")
    private String content;

    @Schema(description = "评价图片，逗号分隔的 URL 字符串")
    private String images;

    @Schema(description = "是否匿名：0 公开，1 匿名", example = "0")
    private Integer isAnonymous;

    @Schema(description = "商家回复内容")
    private String reply;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "评价时间", example = "2026-06-30 10:00:00")
    private LocalDateTime createTime;
}
