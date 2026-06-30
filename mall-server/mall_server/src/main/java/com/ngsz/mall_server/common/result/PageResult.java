package com.ngsz.mall_server.common.result;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "分页结果")
public class PageResult<T> {

    @Schema(description = "总记录数", example = "100")
    private Long total;

    @Schema(description = "当前页数据列表")
    private List<T> list;

    @Schema(description = "当前页码，从 1 开始", example = "1")
    private Integer page;

    @Schema(description = "每页大小", example = "10")
    private Integer size;
}
