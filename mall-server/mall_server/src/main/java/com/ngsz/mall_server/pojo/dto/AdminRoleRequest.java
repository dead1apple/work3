package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class AdminRoleRequest {

    @Size(max = 50, message = "角色名称不能超过 50 个字符")
    private String name;

    @Size(max = 50, message = "角色编码不能超过 50 个字符")
    private String code;

    @Size(max = 512, message = "角色权限数量不能超过 512")
    private List<@NotBlank(message = "角色权限项不能为空")
            @Size(max = 128, message = "单个角色权限不能超过 128 个字符") String> permissions;

    private Integer status;
}
