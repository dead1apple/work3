package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
@Schema(description = "商家发布/修改商品请求参数")
public class ProductDTO {

    @Schema(description = "商品 ID，新增时不传，修改时必传", example = "1")
    private Long id;

    @NotNull(message = "分类 ID 不能为空")
    @Schema(description = "分类 ID", example = "10", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long categoryId;

    @Schema(description = "品牌 ID", example = "5")
    private Long brandId;

    @NotBlank(message = "商品名称不能为空")
    @Size(max = 200, message = "商品名称不能超过 200 个字符")
    @Schema(description = "商品名称", example = "华为 Mate 70 Pro", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Size(max = 500, message = "商品副标题不能超过 500 个字符")
    @Schema(description = "商品副标题/宣传语")
    private String subtitle;

    @Size(max = 500, message = "主图 URL 不能超过 500 个字符")
    @Schema(description = "主图 URL")
    private String mainImage;

    @Schema(description = "商品图片 URL 列表")
    private List<@Size(max = 500, message = "图片 URL 不能超过 500 个字符") String> images;

    @Schema(description = "商品详情（富文本 HTML）")
    private String detail;

    @Schema(description = "无需提交；新增或修改后由服务端统一设置为 2（待审核）", accessMode = Schema.AccessMode.READ_ONLY)
    private Integer status;

    @Valid
    @NotEmpty(message = "SKU 列表至少包含一项")
    @Schema(description = "SKU 列表（至少一个）", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<SkuDTO> skuList;
}
