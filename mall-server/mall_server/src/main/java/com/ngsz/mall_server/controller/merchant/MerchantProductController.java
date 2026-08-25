package com.ngsz.mall_server.controller.merchant;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.ProductDTO;
import com.ngsz.mall_server.service.ProductService;
import com.ngsz.mall_server.service.impl.MerchantAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "18. 商家-商品", description = "商家对自己店铺商品的新增、修改、上下架")
@RestController
@RequestMapping("/api/merchant/products")
public class MerchantProductController {

    @Autowired private ProductService productService;
    @Autowired private MerchantAccessService merchantAccessService;

    private Long getShopId() { return merchantAccessService.requireActiveShop(StpUtil.getLoginIdAsLong()); }

    @Operation(summary = "查询本店商品", description = "分页查询当前商家店铺下的商品，可按关键字和状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "商品名称关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "商品状态：0 下架，1 上架，2 待审核") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(productService.listProducts(null, null, keyword, "default", status, page, size, getShopId()));
    }

    @Operation(summary = "新增商品", description = "提交商品基础信息和 SKU 列表，创建后状态为待审核")
    @PostMapping
    public Result<?> add(@Valid @RequestBody ProductDTO dto) {
        productService.addProduct(getShopId(), dto);
        return Result.success("添加成功");
    }

    @Operation(summary = "修改商品", description = "修改商品信息，需传入商品 ID")
    @PutMapping
    public Result<?> update(@Valid @RequestBody ProductDTO dto) {
        productService.updateProduct(getShopId(), dto);
        return Result.success("修改成功");
    }

    @Operation(summary = "上下架商品", description = "将本店商品切换为上架或下架")
    @PutMapping("/{id}/status")
    public Result<?> updateStatus(
            @Parameter(description = "商品 ID", example = "1") @PathVariable Long id,
            @Parameter(description = "目标状态：0 下架，1 上架", example = "1") @RequestParam Integer status) {
        productService.updateStatus(id, status, getShopId());
        return Result.success("操作成功");
    }
}
