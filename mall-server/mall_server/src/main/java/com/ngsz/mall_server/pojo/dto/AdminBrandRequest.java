package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminBrandRequest {

    @NotBlank(message = "品牌名称不能为空")
    @Size(max = 100, message = "品牌名称不能超过 100 个字符")
    private String name;

    @Size(max = 500, message = "品牌 Logo 地址不能超过 500 个字符")
    private String logo;

    @Size(max = 1000, message = "品牌描述不能超过 1000 个字符")
    private String description;

    @NotNull(message = "排序值不能为空")
    @PositiveOrZero(message = "排序值不能小于 0")
    private Integer sortOrder;

    @NotNull(message = "品牌状态不能为空")
    @Min(value = 0, message = "品牌状态只能是 0 或 1")
    @Max(value = 1, message = "品牌状态只能是 0 或 1")
    private Integer status;
}
