package com.ngsz.mall_server.controller;

import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.vo.ProductDetailVO;
import com.ngsz.mall_server.pojo.vo.ProductListItemVO;
import com.ngsz.mall_server.service.ProductService;
import com.ngsz.mall_server.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "10. 商品", description = "用户端商品列表、详情、评价查询")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired private ProductService productService;
    @Autowired private ReviewService reviewService;

    @Operation(summary = "分页查询商品列表", description = "支持按分类、品牌、关键字过滤，支持按销量/价格等排序")
    @GetMapping
    public Result<PageResult<ProductListItemVO>> list(
            @Parameter(description = "分类 ID", example = "10") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "品牌 ID", example = "5") @RequestParam(required = false) Long brandId,
            @Parameter(description = "搜索关键字", example = "华为") @RequestParam(required = false) String keyword,
            @Parameter(description = "店铺 ID", example = "1") @RequestParam(required = false) Long shopId,
            @Parameter(description = "排序方式：default 默认，sales 销量降序，price_asc 价格升序，price_desc 价格降序",
                    example = "default") @RequestParam(required = false, defaultValue = "default") String sortBy,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(productService.listProducts(categoryId, brandId, keyword, sortBy, 1, page, size, shopId));
    }

    @Operation(summary = "商品详情", description = "返回商品基础信息、Sku 列表、店铺信息等")
    @GetMapping("/{id}")
    public Result<ProductDetailVO> detail(@Parameter(description = "商品 ID", example = "1") @PathVariable Long id) {
        return Result.success(productService.getProductDetail(id));
    }

    @Operation(summary = "商品评价列表", description = "分页查询某商品的用户评价")
    @GetMapping("/{id}/reviews")
    public Result<?> reviews(
            @Parameter(description = "商品 ID", example = "1") @PathVariable Long id,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(reviewService.listByProduct(id, page, size));
    }
}
