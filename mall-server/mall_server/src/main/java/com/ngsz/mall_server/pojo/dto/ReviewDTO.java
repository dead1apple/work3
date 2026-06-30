package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "发表商品评价请求参数")
public class ReviewDTO {

    @NotNull(message = "订单明细ID不能为空")
    @Schema(description = "要评价的订单明细 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long orderItemId;

    @NotNull(message = "评分不能为空")
    @Min(value = 1) @Max(value = 5)
    @Schema(description = "评分：1~5 星", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer rating;

    @Schema(description = "评价内容", example = "手机很棒，物流也快！")
    private String content;

    @Schema(description = "评价图片，逗号分隔的 URL 字符串")
    private String images;

    @Schema(description = "是否匿名：0 公开，1 匿名", example = "0")
    private Integer isAnonymous;
}
