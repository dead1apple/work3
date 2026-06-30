package com.ngsz.mall_server.common.result;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "统一接口响应结果")
public class Result<T> {

    @Schema(description = "状态码：1 成功，-1 失败，其他为业务自定义错误码", example = "1")
    private Integer code;

    @Schema(description = "提示信息", example = "success")
    private String msg;

    @Schema(description = "业务数据，结构由具体接口决定")
    private T data;

    public static <T> Result<T> success() {
        return new Result<>(1, "success", null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(1, "success", data);
    }

    public static <T> Result<T> success(String msg, T data) {
        return new Result<>(1, msg, data);
    }

    public static <T> Result<T> error(String msg) {
        return new Result<>(-1, msg, null);
    }

    public static <T> Result<T> error(Integer code, String msg) {
        return new Result<>(code, msg, null);
    }
}
