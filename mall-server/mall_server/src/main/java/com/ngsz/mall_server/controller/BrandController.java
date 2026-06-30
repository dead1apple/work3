package com.ngsz.mall_server.controller;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.BrandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "03. 品牌", description = "商品品牌的查询接口")
@RestController
@RequestMapping("/api/brands")
public class BrandController {

    @Autowired private BrandService brandService;

    @Operation(summary = "查询所有启用品牌", description = "返回状态为启用的所有品牌列表，按排序值升序")
    @GetMapping
    public Result<?> list() {
        return Result.success(brandService.listAll());
    }

    @Operation(summary = "查询品牌详情", description = "根据品牌 ID 查询单个品牌")
    @GetMapping("/{id}")
    public Result<?> detail(@Parameter(description = "品牌 ID", example = "1") @PathVariable Long id) {
        return Result.success(brandService.getById(id));
    }
}
