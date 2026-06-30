package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "品牌")
public class Brand {

    @Schema(description = "品牌 ID", example = "1")
    private Long id;

    @Schema(description = "品牌名称", example = "华为")
    private String name;

    @Schema(description = "品牌 Logo URL")
    private String logo;

    @Schema(description = "品牌描述")
    private String description;

    @Schema(description = "排序值，数字越小越靠前", example = "10")
    private Integer sortOrder;

    @Schema(description = "状态：0 禁用，1 启用", example = "1")
    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
