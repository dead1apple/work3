package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Cart;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CartMapper {
    List<Cart> findByUserId(@Param("userId") Long userId);
    Cart findByUserAndSku(@Param("userId") Long userId, @Param("skuId") Long skuId);
    void insert(Cart cart);
    void updateQuantity(Cart cart);
    void updateSelected(Cart cart);
    void selectAll(@Param("userId") Long userId, @Param("selected") Integer selected);
    void deleteById(@Param("id") Long id);
    void deleteByUserIdAndIds(@Param("userId") Long userId, @Param("ids") List<Long> ids);
}
