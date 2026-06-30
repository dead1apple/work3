package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Schema(description = "用户收货地址")
public class UserAddress {

    @Schema(description = "地址 ID", example = "1")
    private Long id;

    @Schema(description = "所属用户 ID", example = "1")
    private Long userId;

    @Schema(description = "收货人姓名", example = "张三")
    private String receiverName;

    @Schema(description = "收货人手机号", example = "13800138000")
    private String receiverPhone;

    @Schema(description = "省份", example = "广东省")
    private String province;

    @Schema(description = "城市", example = "深圳市")
    private String city;

    @Schema(description = "区/县", example = "南山区")
    private String district;

    @Schema(description = "详细地址（街道、门牌号）", example = "科技园路 1 号 2 栋 3 楼")
    private String detailAddress;

    @Schema(description = "是否默认地址：0 否，1 是", example = "1")
    private Integer isDefault;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
