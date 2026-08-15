package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminCategoryRequest {

    @NotNull(message = "父分类 ID 不能为空")
    @PositiveOrZero(message = "父分类 ID 不能小于 0")
    private Long parentId;

    @NotBlank(message = "分类名称不能为空")
    @Size(max = 50, message = "分类名称不能超过 50 个字符")
    private String name;

    @NotNull(message = "分类层级不能为空")
    @Min(value = 1, message = "分类层级必须在 1 到 3 之间")
    @Max(value = 3, message = "分类层级必须在 1 到 3 之间")
    private Integer level;

    @Size(max = 500, message = "分类图标地址不能超过 500 个字符")
    private String icon;

    @NotNull(message = "排序值不能为空")
    @PositiveOrZero(message = "排序值不能小于 0")
    private Integer sortOrder;

    @NotNull(message = "分类状态不能为空")
    @Min(value = 0, message = "分类状态只能是 0 或 1")
    @Max(value = 1, message = "分类状态只能是 0 或 1")
    private Integer status;
}
