package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.CouponTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CouponTemplateMapper {
    CouponTemplate findById(@Param("id") Long id);
    List<CouponTemplate> findAvailable(@Param("shopId") Long shopId);
    List<CouponTemplate> findByCondition(
            @Param("keyword") String keyword, @Param("status") Integer status);
    void insert(CouponTemplate template);
    void update(CouponTemplate template);
    void incrementIssuedCount(@Param("id") Long id);
    void incrementUsedCount(@Param("id") Long id);
}
