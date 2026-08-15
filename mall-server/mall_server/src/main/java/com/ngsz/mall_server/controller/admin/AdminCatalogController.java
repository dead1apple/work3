package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.AdminBrandRequest;
import com.ngsz.mall_server.pojo.dto.AdminCategoryRequest;
import com.ngsz.mall_server.service.AdminContentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {

    private final AdminContentService contentService;

    public AdminCatalogController(AdminContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/categories")
    public Result<?> categories() {
        return Result.success(contentService.listCategories());
    }

    @PostMapping("/categories")
    public Result<?> createCategory(@Valid @RequestBody AdminCategoryRequest request) {
        return Result.success("分类创建成功", contentService.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    public Result<?> updateCategory(
            @PathVariable Long id, @Valid @RequestBody AdminCategoryRequest request) {
        contentService.updateCategory(id, request);
        return Result.success("分类更新成功");
    }

    @PutMapping("/categories/{id}/status")
    public Result<?> updateCategoryStatus(
            @PathVariable Long id, @RequestParam Integer status) {
        contentService.updateCategoryStatus(id, status);
        return Result.success("分类状态更新成功");
    }

    @GetMapping("/brands")
    public Result<?> brands() {
        return Result.success(contentService.listBrands());
    }

    @PostMapping("/brands")
    public Result<?> createBrand(@Valid @RequestBody AdminBrandRequest request) {
        return Result.success("品牌创建成功", contentService.createBrand(request));
    }

    @PutMapping("/brands/{id}")
    public Result<?> updateBrand(
            @PathVariable Long id, @Valid @RequestBody AdminBrandRequest request) {
        contentService.updateBrand(id, request);
        return Result.success("品牌更新成功");
    }

    @PutMapping("/brands/{id}/status")
    public Result<?> updateBrandStatus(@PathVariable Long id, @RequestParam Integer status) {
        contentService.updateBrandStatus(id, status);
        return Result.success("品牌状态更新成功");
    }
}
