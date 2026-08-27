package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.UserCoupon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface UserCouponMapper {
    List<UserCoupon> findByUserId(@Param("userId") Long userId, @Param("status") Integer status);
    UserCoupon findById(@Param("id") Long id);
    UserCoupon findByIdForUpdate(@Param("id") Long id);
    UserCoupon findByIdForUpdateByOrderNo(@Param("orderNo") String orderNo);
    UserCoupon findByOrderNo(@Param("orderNo") String orderNo);
    void insert(UserCoupon userCoupon);
    void update(UserCoupon userCoupon);
    int lockForOrder(@Param("id") Long id, @Param("userId") Long userId,
                     @Param("orderNo") String orderNo);
    int consumeLockedByOrderNo(@Param("orderNo") String orderNo);
    int releaseLockedByOrderNo(@Param("orderNo") String orderNo);
    int expireAvailableCoupons();
    List<Map<String, Object>> findViewsByUserId(@Param("userId") Long userId, @Param("status") Integer status);
    List<Map<String, Object>> findViewsByTemplateId(@Param("templateId") Long templateId);
    int countByUserAndTemplate(@Param("userId") Long userId, @Param("templateId") Long templateId);
    int countByTemplate(@Param("templateId") Long templateId);
}
