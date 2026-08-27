package com.ngsz.mall_server.service;
import com.ngsz.mall_server.pojo.CouponTemplate;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.UserCoupon;
import com.ngsz.mall_server.pojo.dto.MerchantCouponRequest;
import com.ngsz.mall_server.common.result.PageResult;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface CouponService {
    List<CouponTemplate> listAvailable(Long shopId);
    void claimCoupon(Long userId, Long templateId);
    List<UserCoupon> listMyCoupons(Long userId, Integer status);
    List<Map<String, Object>> listMyCouponViews(Long userId, Integer status);
    List<Map<String, Object>> listUsableCouponsForOrder(Long userId, Long shopId, BigDecimal goodsAmount);
    List<CouponTemplate> listAllAvailable();
    BigDecimal lockCouponForOrder(
            Long userId, Long userCouponId, Long shopId, BigDecimal goodsAmount, String orderNo);
    void consumeLockedCoupon(String orderNo);
    void releaseLockedCoupon(String orderNo);
    void recordOrderCouponSnapshot(Order order);
    int expireAvailableCoupons();
    PageResult<CouponTemplate> listMerchantCoupons(
            Long shopId, String keyword, Integer status, Integer page, Integer size);
    CouponTemplate createMerchantCoupon(Long shopId, MerchantCouponRequest request);
    CouponTemplate getMerchantCoupon(Long shopId, Long id);
    void deleteMerchantCoupon(Long shopId, Long id);
    void updateMerchantCoupon(Long shopId, Long id, MerchantCouponRequest request);
    void updateMerchantCouponStatus(Long shopId, Long id, Integer status);
    Map<String, Object> merchantCouponStatistics(Long shopId, Long id);
    List<Map<String, Object>> listMerchantCouponUsers(Long shopId, Long id);
    CouponTemplate getCoupon(Long id);
    List<Map<String, Object>> listCouponOperations(Long id);
    Map<String, Object> couponStatistics(Long id);
}
