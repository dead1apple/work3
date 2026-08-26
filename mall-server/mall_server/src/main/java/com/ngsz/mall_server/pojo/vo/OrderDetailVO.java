package com.ngsz.mall_server.pojo.vo;

import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.OrderItem;
import com.ngsz.mall_server.pojo.Payment;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "订单详情")
public class OrderDetailVO {

    @Schema(description = "订单基础信息")
    private Order order;

    @Schema(description = "订单商品明细")
    private List<OrderItem> items;

    @Schema(description = "支付流水；尚未生成支付记录时为 null")
    private Payment payment;
}
