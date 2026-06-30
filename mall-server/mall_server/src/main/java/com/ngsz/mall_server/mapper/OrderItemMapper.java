package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.OrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderItemMapper {
    List<OrderItem> findByOrderId(@Param("orderId") Long orderId);
    List<OrderItem> findByOrderNo(@Param("orderNo") String orderNo);
    OrderItem findById(@Param("id") Long id);
    void insert(OrderItem orderItem);
}
