package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Sku;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface SkuMapper {
    Sku findById(@Param("id") Long id);
    List<Sku> findByProductId(@Param("productId") Long productId);
    void insert(Sku sku);
    void update(Sku sku);
    void softDeleteByIds(@Param("productId") Long productId, @Param("ids") List<Long> ids);
    void updateStock(@Param("id") Long id, @Param("quantity") Integer quantity);
    int lockStock(@Param("id") Long id, @Param("quantity") Integer quantity);
    int unlockStock(@Param("id") Long id, @Param("quantity") Integer quantity);
    int deductStock(@Param("id") Long id, @Param("quantity") Integer quantity);
}
