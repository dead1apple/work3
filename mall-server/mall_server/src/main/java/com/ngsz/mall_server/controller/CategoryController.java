package com.ngsz.mall_server.controller;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "05. 商品分类", description = "商品分类的树形结构和子分类查询")
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired private CategoryService categoryService;

    @Operation(summary = "查询分类树", description = "一次性返回所有启用的商品分类（树形结构）")
    @GetMapping("/tree")
    public Result<?> tree() {
        return Result.success(categoryService.getCategoryTree());
    }

    @Operation(summary = "查询子分类", description = "根据父分类 ID 查询其直接子分类")
    @GetMapping("/children")
    public Result<?> children(
            @Parameter(description = "父分类 ID，0 表示查询一级分类", example = "0")
            @RequestParam(defaultValue = "0") Long parentId) {
        return Result.success(categoryService.listByParentId(parentId));
    }
}
