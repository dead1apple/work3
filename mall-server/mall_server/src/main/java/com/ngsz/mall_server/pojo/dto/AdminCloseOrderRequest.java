package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminCloseOrderRequest {

    @NotBlank(message = "关闭原因不能为空")
    private String reason;
}
