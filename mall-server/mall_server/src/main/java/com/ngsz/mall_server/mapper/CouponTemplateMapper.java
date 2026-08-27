package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.CouponTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CouponTemplateMapper {
    CouponTemplate findById(@Param("id") Long id);
    CouponTemplate findByIdForUpdate(@Param("id") Long id);
    List<CouponTemplate> findAvailable(@Param("shopId") Long shopId);
    List<CouponTemplate> findAllAvailable();
    List<CouponTemplate> findByCondition(
            @Param("keyword") String keyword, @Param("status") Integer status);
    void insert(CouponTemplate template);
    void update(CouponTemplate template);
    int deleteById(@Param("id") Long id);
    int incrementIssuedCount(@Param("id") Long id);
    int incrementUsedCount(@Param("id") Long id);
    List<CouponTemplate> findByShopIdAndCondition(
            @Param("shopId") Long shopId, @Param("keyword") String keyword,
            @Param("status") Integer status);
}
