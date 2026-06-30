package com.ngsz.mall_server.controller.merchant;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.Shop;
import com.ngsz.mall_server.pojo.dto.DeliverDTO;
import com.ngsz.mall_server.service.OrderService;
import com.ngsz.mall_server.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "17. 商家-订单", description = "商家端订单查询与发货")
@RestController
@RequestMapping("/api/merchant/orders")
public class MerchantOrderController {

    @Autowired private OrderService orderService;
    @Autowired private ShopService shopService;

    private Long getShopId() {
        Shop shop = shopService.getByUserId(StpUtil.getLoginIdAsLong());
        if (shop == null) throw new BusinessException("您还没有店铺");
        return shop.getId();
    }

    @Operation(summary = "查询本店订单", description = "分页查询当前商家名下店铺的订单，可按状态过滤")
    @GetMapping
    public Result<?> list(
            @Parameter(description = "订单状态") @RequestParam(required = false) Integer status,
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(orderService.listOrders(null, status, getShopId(), page, size));
    }

    @Operation(summary = "订单发货", description = "为待发货订单填写物流单号和物流公司完成发货")
    @PostMapping("/deliver")
    public Result<?> deliver(@Valid @RequestBody DeliverDTO dto) {
        orderService.deliver(dto);
        return Result.success("发货成功");
    }
}
