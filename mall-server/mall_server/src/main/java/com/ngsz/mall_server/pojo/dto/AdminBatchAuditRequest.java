package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AdminBatchAuditRequest {

    @NotBlank(message = "审核类型不能为空")
    private String type;

    @NotEmpty(message = "审核目标不能为空")
    private List<Long> ids;

    @NotBlank(message = "审核动作不能为空")
    private String action;

    private String reason;
}
