package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Schema(description = "商品 SKU 信息（随商品一起提交）")
public class SkuDTO {

    @Schema(description = "SKU ID，新增时不传，修改时必传", example = "10")
    private Long id;

    @NotBlank(message = "SKU 名称不能为空")
    @Size(max = 200, message = "SKU 名称不能超过 200 个字符")
    @Schema(description = "SKU 名称", example = "12+256 曜石黑", requiredMode = Schema.RequiredMode.REQUIRED)
    private String skuName;

    @Size(max = 500, message = "规格值不能超过 500 个字符")
    @Schema(description = "规格值，JSON 字符串", example = "{\"颜色\":\"曜石黑\",\"内存\":\"12+256\"}")
    private String specValues;

    @NotNull(message = "销售价不能为空")
    @DecimalMin(value = "0.00", message = "销售价不能小于 0")
    @Schema(description = "销售价（元）", example = "6999.00", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal price;

    @DecimalMin(value = "0.00", message = "市场价不能小于 0")
    @Schema(description = "市场价/划线价（元）", example = "7999.00")
    private BigDecimal marketPrice;

    @DecimalMin(value = "0.00", message = "成本价不能小于 0")
    @Schema(description = "成本价（元）", example = "6000.00")
    private BigDecimal costPrice;

    @NotNull(message = "库存不能为空")
    @Min(value = 0, message = "库存不能小于 0")
    @Schema(description = "库存", example = "100", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer stock;

    @Size(max = 500, message = "SKU 图片 URL 不能超过 500 个字符")
    @Schema(description = "SKU 图片 URL")
    private String image;

    @Size(max = 100, message = "SKU 编码不能超过 100 个字符")
    @Schema(description = "SKU 编码", example = "MATE70-BK-256")
    private String skuCode;

    @DecimalMin(value = "0.00", message = "重量不能小于 0")
    @Schema(description = "重量（kg）", example = "0.22")
    private BigDecimal weight;

    @Min(value = 0, message = "SKU 状态只能是 0 或 1")
    @Max(value = 1, message = "SKU 状态只能是 0 或 1")
    @Schema(description = "状态：0 禁用，1 启用；不传默认为 1", example = "1")
    private Integer status;
}
