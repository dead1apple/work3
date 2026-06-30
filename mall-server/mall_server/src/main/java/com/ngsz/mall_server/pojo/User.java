package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Schema(description = "用户实体")
public class User {

    @Schema(description = "用户 ID", example = "1")
    private Long id;

    @Schema(description = "用户名（登录用）", example = "zhangsan")
    private String username;

    @Schema(description = "密码（BCrypt 加密后）", hidden = true)
    private String password;

    @Schema(description = "昵称", example = "张三")
    private String nickname;

    @Schema(description = "手机号", example = "13800138000")
    private String phone;

    @Schema(description = "邮箱", example = "zhangsan@example.com")
    private String email;

    @Schema(description = "头像 URL")
    private String avatar;

    @Schema(description = "性别：0 未知，1 男，2 女", example = "1")
    private Integer gender;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(description = "生日", example = "2000-01-01")
    private LocalDate birthday;

    @Schema(description = "状态：0 禁用，1 正常", example = "1")
    private Integer status;

    @Schema(description = "角色：0 普通用户，1 商家，2 管理员", example = "0")
    private Integer role;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "最近登录时间", example = "2026-06-30 10:00:00")
    private LocalDateTime lastLoginTime;

    @Schema(description = "最近登录 IP", example = "127.0.0.1")
    private String lastLoginIp;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "逻辑删除标记：0 未删，1 已删", hidden = true)
    private Integer deleted;
}
