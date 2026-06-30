package com.ngsz.mall_server.pojo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@Schema(description = "注册请求参数")
public class RegisterDTO {

    @NotBlank(message = "用户名不能为空")
    @Schema(description = "用户名（唯一）", example = "zhangsan", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @NotBlank(message = "密码不能为空")
    @Schema(description = "明文密码", example = "123456", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;

    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    @Schema(description = "手机号", example = "13800138000", requiredMode = Schema.RequiredMode.REQUIRED)
    private String phone;

    @NotBlank(message = "验证码不能为空")
    @Schema(description = "短信验证码", example = "888888", requiredMode = Schema.RequiredMode.REQUIRED)
    private String code;

    @Schema(description = "昵称（可选，默认与用户名一致）", example = "张三")
    private String nickname;

    @Schema(description = "邮箱（可选）", example = "zhangsan@example.com")
    private String email;
}
