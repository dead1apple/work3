package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.CouponTemplateMapper;
import com.ngsz.mall_server.mapper.CouponOperationLogMapper;
import com.ngsz.mall_server.mapper.UserCouponMapper;
import com.ngsz.mall_server.pojo.CouponTemplate;
import com.ngsz.mall_server.pojo.UserCoupon;
import com.ngsz.mall_server.pojo.dto.MerchantCouponRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceImplTest {

    @Mock private CouponTemplateMapper couponTemplateMapper;
    @Mock private CouponOperationLogMapper couponOperationLogMapper;
    @Mock private UserCouponMapper userCouponMapper;
    @InjectMocks private CouponServiceImpl service;

    @Test
    void locksMatchingStoreCouponAndCalculatesFullReduction() {
        UserCoupon userCoupon = userCoupon(8L, 7L, 2L);
        CouponTemplate template = template(2L, 12L, 1, "20.00", "100.00");
        when(userCouponMapper.findByIdForUpdate(8L)).thenReturn(userCoupon);
        when(couponTemplateMapper.findById(2L)).thenReturn(template);
        when(userCouponMapper.lockForOrder(8L, 7L, "ORDER-1")).thenReturn(1);

        BigDecimal discount = service.lockCouponForOrder(
                7L, 8L, 12L, new BigDecimal("150.00"), "ORDER-1");

        assertThat(discount).isEqualByComparingTo("20.00");
        verify(userCouponMapper).lockForOrder(8L, 7L, "ORDER-1");
    }

    @Test
    void rejectsCouponFromAnotherStoreBeforeLocking() {
        UserCoupon userCoupon = userCoupon(8L, 7L, 2L);
        CouponTemplate template = template(2L, 12L, 1, "20.00", "100.00");
        when(userCouponMapper.findByIdForUpdate(8L)).thenReturn(userCoupon);
        when(couponTemplateMapper.findById(2L)).thenReturn(template);

        assertThatThrownBy(() -> service.lockCouponForOrder(
                7L, 8L, 13L, new BigDecimal("150.00"), "ORDER-1"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("优惠券不适用于当前店铺");
        verify(userCouponMapper, never()).lockForOrder(8L, 7L, "ORDER-1");
    }

    @Test
    void consumesLockedCouponAndIncrementsTemplateUsage() {
        UserCoupon userCoupon = userCoupon(8L, 7L, 2L);
        userCoupon.setStatus(3);
        when(userCouponMapper.findByIdForUpdateByOrderNo("ORDER-1")).thenReturn(userCoupon);
        when(userCouponMapper.consumeLockedByOrderNo("ORDER-1")).thenReturn(1);
        when(couponTemplateMapper.incrementUsedCount(2L)).thenReturn(1);

        service.consumeLockedCoupon("ORDER-1");

        verify(couponTemplateMapper).incrementUsedCount(2L);
    }

    @Test
    void merchantCannotUpdateAnotherShopsCoupon() {
        CouponTemplate coupon = template(4L, 12L, 1, "20.00", "100.00");
        when(couponTemplateMapper.findById(4L)).thenReturn(coupon);

        assertThatThrownBy(() -> service.updateMerchantCoupon(13L, 4L, merchantRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessage("优惠券不存在");

        verify(couponTemplateMapper, never()).update(coupon);
    }

    @Test
    void merchantCanDeleteUnclaimedCouponFromOwnShop() {
        CouponTemplate coupon = template(5L, 12L, 1, "20.00", "100.00");
        coupon.setIssuedCount(0);
        when(couponTemplateMapper.findByIdForUpdate(5L)).thenReturn(coupon);
        when(userCouponMapper.countByTemplate(5L)).thenReturn(0);
        when(couponTemplateMapper.deleteById(5L)).thenReturn(1);

        service.deleteMerchantCoupon(12L, 5L);

        verify(couponTemplateMapper).deleteById(5L);
    }

    @Test
    void merchantCannotDeleteCouponWithIssuedUsers() {
        CouponTemplate coupon = template(6L, 12L, 1, "20.00", "100.00");
        coupon.setIssuedCount(1);
        when(couponTemplateMapper.findByIdForUpdate(6L)).thenReturn(coupon);
        when(userCouponMapper.countByTemplate(6L)).thenReturn(1);

        assertThatThrownBy(() -> service.deleteMerchantCoupon(12L, 6L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("已有用户领取的优惠券不能删除");
        verify(couponTemplateMapper, never()).deleteById(6L);
    }

    private static UserCoupon userCoupon(Long id, Long userId, Long templateId) {
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setId(id);
        userCoupon.setUserId(userId);
        userCoupon.setCouponTemplateId(templateId);
        userCoupon.setStatus(0);
        return userCoupon;
    }

    private static CouponTemplate template(
            Long id, Long shopId, int type, String amount, String minAmount) {
        CouponTemplate template = new CouponTemplate();
        template.setId(id);
        template.setShopId(shopId);
        template.setType(type);
        template.setAmount(new BigDecimal(amount));
        template.setMinAmount(new BigDecimal(minAmount));
        template.setStatus(1);
        template.setStartTime(LocalDateTime.now().minusDays(1));
        template.setEndTime(LocalDateTime.now().plusDays(1));
        return template;
    }

    private static MerchantCouponRequest merchantRequest() {
        MerchantCouponRequest request = new MerchantCouponRequest();
        request.setName("满100减20");
        request.setType(1);
        request.setAmount(new BigDecimal("20.00"));
        request.setMinAmount(new BigDecimal("100.00"));
        request.setTotalCount(100);
        request.setStartTime(LocalDateTime.now().minusDays(1));
        request.setEndTime(LocalDateTime.now().plusDays(1));
        request.setStatus(1);
        return request;
    }
}
