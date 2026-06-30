package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "新增/修改收货地址请求参数")
public class AddressDTO {

    @Schema(description = "地址 ID，新增时不传，修改时必传", example = "1")
    private Long id;

    @NotBlank(message = "收货人不能为空")
    @Schema(description = "收货人姓名", example = "张三", requiredMode = Schema.RequiredMode.REQUIRED)
    private String receiverName;

    @NotBlank(message = "收货人电话不能为空")
    @Schema(description = "收货人手机号", example = "13800138000", requiredMode = Schema.RequiredMode.REQUIRED)
    private String receiverPhone;

    @NotBlank(message = "省份不能为空")
    @Schema(description = "省份", example = "广东省", requiredMode = Schema.RequiredMode.REQUIRED)
    private String province;

    @NotBlank(message = "城市不能为空")
    @Schema(description = "城市", example = "深圳市", requiredMode = Schema.RequiredMode.REQUIRED)
    private String city;

    @NotBlank(message = "区县不能为空")
    @Schema(description = "区/县", example = "南山区", requiredMode = Schema.RequiredMode.REQUIRED)
    private String district;

    @NotBlank(message = "详细地址不能为空")
    @Schema(description = "详细地址（街道、门牌号）", example = "科技园路 1 号 2 栋 3 楼", requiredMode = Schema.RequiredMode.REQUIRED)
    private String detailAddress;

    @Schema(description = "是否设为默认地址：0 否，1 是", example = "0")
    private Integer isDefault;
}
