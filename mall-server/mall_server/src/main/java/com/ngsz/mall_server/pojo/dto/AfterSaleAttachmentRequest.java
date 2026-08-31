package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "售后工单补充附件请求")
public class AfterSaleAttachmentRequest {
    @Valid
    @NotEmpty(message = "补充附件不能为空")
    @Size(max = 9, message = "单次最多补充 9 个附件")
    @Schema(description = "OSS 附件引用")
    private List<Attachment> attachments = new ArrayList<>();

    @Data
    @Schema(description = "OSS 附件")
    public static class Attachment {
        @NotBlank(message = "附件 URL 不能为空")
        private String url;

        @NotBlank(message = "附件 ObjectKey 不能为空")
        private String objectKey;

        @Size(max = 255, message = "附件文件名不能超过 255 个字符")
        private String fileName;

        @Positive(message = "附件大小必须大于 0")
        private Long fileSize;
    }
}
