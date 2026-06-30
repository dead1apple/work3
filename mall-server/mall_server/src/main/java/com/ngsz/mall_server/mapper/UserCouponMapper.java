package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.UserCoupon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserCouponMapper {
    List<UserCoupon> findByUserId(@Param("userId") Long userId, @Param("status") Integer status);
    UserCoupon findById(@Param("id") Long id);
    void insert(UserCoupon userCoupon);
    void update(UserCoupon userCoupon);
    int countByUserAndTemplate(@Param("userId") Long userId, @Param("templateId") Long templateId);
}
