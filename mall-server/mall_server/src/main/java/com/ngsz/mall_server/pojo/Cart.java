package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "购物车条目")
public class Cart {

    @Schema(description = "购物车条目 ID", example = "1")
    private Long id;

    @Schema(description = "所属用户 ID", example = "1")
    private Long userId;

    @Schema(description = "SKU ID", example = "10")
    private Long skuId;

    @Schema(description = "商品 ID（冗余字段，方便展示）", example = "1")
    private Long productId;

    @Schema(description = "购买数量", example = "1")
    private Integer quantity;

    @Schema(description = "是否选中：0 否，1 是", example = "1")
    private Integer selected;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "加入购物车时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
