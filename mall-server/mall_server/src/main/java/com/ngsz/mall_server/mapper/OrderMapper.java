package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderMapper {
    Order findByOrderNo(@Param("orderNo") String orderNo);
    Order findById(@Param("id") Long id);
    List<Order> findByUserId(@Param("userId") Long userId, @Param("status") Integer status, @Param("offset") Integer offset, @Param("size") Integer size);
    int countByUserId(@Param("userId") Long userId, @Param("status") Integer status);
    List<Order> findByCondition(@Param("keyword") String keyword, @Param("status") Integer status,
                                 @Param("shopId") Long shopId, @Param("offset") Integer offset, @Param("size") Integer size);
    int countByCondition(@Param("keyword") String keyword, @Param("status") Integer status, @Param("shopId") Long shopId);
    void insert(Order order);
    void update(Order order);
    void updateStatus(@Param("orderNo") String orderNo, @Param("status") Integer status);
}
