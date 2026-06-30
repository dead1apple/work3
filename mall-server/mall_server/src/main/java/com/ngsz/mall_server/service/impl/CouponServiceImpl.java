package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.CouponTemplateMapper;
import com.ngsz.mall_server.mapper.UserCouponMapper;
import com.ngsz.mall_server.pojo.CouponTemplate;
import com.ngsz.mall_server.pojo.UserCoupon;
import com.ngsz.mall_server.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CouponServiceImpl implements CouponService {
    @Autowired private CouponTemplateMapper couponTemplateMapper;
    @Autowired private UserCouponMapper userCouponMapper;

    @Override public List<CouponTemplate> listAvailable(Long shopId) { return couponTemplateMapper.findAvailable(shopId); }

    @Override @Transactional
    public void claimCoupon(Long userId, Long templateId) {
        CouponTemplate t = couponTemplateMapper.findById(templateId);
        if (t == null) throw new BusinessException("优惠券不存在");
        if (t.getStatus() != 1) throw new BusinessException("优惠券已停用");
        if (t.getIssuedCount() >= t.getTotalCount()) throw new BusinessException("优惠券已领完");
        if (userCouponMapper.countByUserAndTemplate(userId, templateId) > 0) throw new BusinessException("您已领取过该优惠券");
        couponTemplateMapper.incrementIssuedCount(templateId);
        UserCoupon uc = new UserCoupon(); uc.setUserId(userId); uc.setCouponTemplateId(templateId); uc.setStatus(0);
        userCouponMapper.insert(uc);
    }

    @Override public List<UserCoupon> listMyCoupons(Long userId, Integer status) { return userCouponMapper.findByUserId(userId, status); }
}
