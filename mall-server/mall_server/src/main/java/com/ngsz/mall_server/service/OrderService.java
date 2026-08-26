package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.dto.*;
import com.ngsz.mall_server.pojo.vo.OrderDetailVO;
import java.util.Map;

public interface OrderService {
    Map<String, Object> createOrder(Long userId, CreateOrderDTO dto);
    Map<String, Object> buyNow(Long userId, BuyNowDTO dto);
    OrderDetailVO getOrderDetail(Long userId, String orderNo);
    OrderDetailVO getMerchantOrderDetail(Long shopId, String orderNo);
    PageResult<Order> listUserOrders(Long userId, Integer status, Integer page, Integer size);
    void cancelOrder(Long userId, String orderNo);
    int cancelExpiredOrders();
    boolean cancelExpiredOrder(String orderNo);
    void confirmReceive(Long userId, String orderNo);
    void deleteOrder(Long userId, String orderNo);
    PageResult<Order> listOrders(String keyword, Integer status, Long shopId, Integer page, Integer size);
    void deliver(Long shopId, DeliverDTO dto);
}
