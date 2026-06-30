package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "商品分类")
public class Category {

    @Schema(description = "分类 ID", example = "1")
    private Long id;

    @Schema(description = "父分类 ID，0 表示顶级分类", example = "0")
    private Long parentId;

    @Schema(description = "分类名称", example = "手机")
    private String name;

    @Schema(description = "分类层级：1 一级，2 二级，3 三级", example = "1")
    private Integer level;

    @Schema(description = "分类图标 URL")
    private String icon;

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
