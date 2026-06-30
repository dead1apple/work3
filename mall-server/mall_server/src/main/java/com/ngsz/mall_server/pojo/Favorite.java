package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "商品收藏记录")
public class Favorite {

    @Schema(description = "收藏记录 ID", example = "1")
    private Long id;

    @Schema(description = "用户 ID", example = "1")
    private Long userId;

    @Schema(description = "被收藏的商品 ID", example = "100")
    private Long productId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "收藏时间", example = "2026-06-30 10:00:00")
    private LocalDateTime createTime;
}
