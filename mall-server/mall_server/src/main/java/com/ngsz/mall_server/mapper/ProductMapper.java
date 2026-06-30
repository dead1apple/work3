package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ProductMapper {
    Product findById(@Param("id") Long id);
    List<Product> findByCondition(@Param("categoryId") Long categoryId, @Param("brandId") Long brandId,
                                   @Param("keyword") String keyword, @Param("status") Integer status,
                                   @Param("shopId") Long shopId, @Param("offset") Integer offset,
                                   @Param("size") Integer size, @Param("sortBy") String sortBy);
    int countByCondition(@Param("categoryId") Long categoryId, @Param("brandId") Long brandId,
                         @Param("keyword") String keyword, @Param("status") Integer status,
                         @Param("shopId") Long shopId);
    void insert(Product product);
    void update(Product product);
    void updateSalesCount(@Param("id") Long id, @Param("quantity") Integer quantity);
}
