package com.ngsz.mall_server.scheduler;

import com.ngsz.mall_server.service.OrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OrderTimeoutScheduler {

    private final OrderService orderService;

    public OrderTimeoutScheduler(OrderService orderService) {
        this.orderService = orderService;
    }

    @Scheduled(fixedDelayString = "${mall.order.timeout-scan-delay-ms:60000}")
    public void cancelExpiredOrders() {
        int cancelledCount = orderService.cancelExpiredOrders();
        if (cancelledCount > 0) {
            log.info("订单超时取消完成，取消订单数: {}", cancelledCount);
        }
    }
}
