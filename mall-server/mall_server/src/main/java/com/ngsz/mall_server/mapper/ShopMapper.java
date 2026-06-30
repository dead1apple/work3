package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Shop;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ShopMapper {
    Shop findById(@Param("id") Long id);
    Shop findByUserId(@Param("userId") Long userId);
    List<Shop> findByCondition(@Param("keyword") String keyword, @Param("status") Integer status);
    void insert(Shop shop);
    void update(Shop shop);
}
