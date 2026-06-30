package com.ngsz.mall_server.service;
import com.ngsz.mall_server.pojo.CouponTemplate;
import com.ngsz.mall_server.pojo.UserCoupon;
import java.util.List;

public interface CouponService {
    List<CouponTemplate> listAvailable(Long shopId);
    void claimCoupon(Long userId, Long templateId);
    List<UserCoupon> listMyCoupons(Long userId, Integer status);
}
