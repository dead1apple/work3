package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "店铺")
public class Shop {

    @Schema(description = "店铺 ID", example = "100")
    private Long id;

    @Schema(description = "店主用户 ID", example = "10")
    private Long userId;

    @Schema(description = "店铺名称", example = "华为官方旗舰店")
    private String shopName;

    @Schema(description = "店铺 Logo URL")
    private String logo;

    @Schema(description = "店铺简介")
    private String description;

    @Schema(description = "营业执照图片 URL")
    private String licenseImage;

    @Schema(description = "店铺状态：0 待审核，1 营业中，2 禁用，3 拒绝", example = "1")
    private Integer status;

    @Schema(description = "店铺综合评分（0~5）", example = "4.8")
    private BigDecimal rating;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
