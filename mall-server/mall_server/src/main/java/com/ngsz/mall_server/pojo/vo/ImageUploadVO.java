package com.ngsz.mall_server.pojo.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "图片上传结果")
public class ImageUploadVO {

    @Schema(description = "可直接访问的绝对图片 URL", example = "https://example.com/uploads/images/2026/08/26/uuid.jpg")
    private String url;

    @Schema(description = "上传时的原始文件名", example = "product.jpg")
    private String originalName;

    @Schema(description = "文件大小（字节）", example = "102400")
    private Long size;
}
