package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.service.AdminPlatformService;
import com.ngsz.mall_server.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "14. 管理员-商品", description = "管理员对商品的查询与审核")
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    @Autowired private ProductService productService;
    @Autowired private AdminPlatformService adminPlatformService;

    @Operation(summary = "分页查询商品", description = "管理员查看平台所有商品，可按分类、关键字、状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "分类 ID") @RequestParam(required = false) Long categoryId,
            @Parameter(description = "商品名称关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "商品状态：0 下架，1 上架，2 待审核") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(productService.listProducts(categoryId, null, keyword, "default", status, page, size));
    }

    @Operation(summary = "审核或管理商品状态", description = "目标状态：0 下架/拒绝，1 上架/通过")
    @PutMapping("/{id}/audit")
    public Result<?> audit(
            @Parameter(description = "商品 ID", example = "1") @PathVariable Long id,
            @Parameter(description = "目标状态：0 拒绝，1 通过", example = "1") @RequestParam Integer status) {
        adminPlatformService.updateProductStatus(StpUtil.getLoginIdAsLong(), id, status);
        return Result.success("操作完成");
    }

    @GetMapping("/{id}/detail")
    public Result<?> detail(@PathVariable Long id) {
        return Result.success(adminPlatformService.productDetail(id));
    }
}
