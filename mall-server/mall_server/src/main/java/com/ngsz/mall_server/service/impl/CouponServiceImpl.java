package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.CouponOperationLogMapper;
import com.ngsz.mall_server.mapper.CouponTemplateMapper;
import com.ngsz.mall_server.mapper.OrderCouponSnapshotMapper;
import com.ngsz.mall_server.mapper.UserCouponMapper;
import com.ngsz.mall_server.pojo.CouponTemplate;
import com.ngsz.mall_server.pojo.CouponOperationLog;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.OrderCouponSnapshot;
import com.ngsz.mall_server.pojo.UserCoupon;
import com.ngsz.mall_server.pojo.dto.MerchantCouponRequest;
import com.ngsz.mall_server.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CouponServiceImpl implements CouponService {
    @Autowired private CouponTemplateMapper couponTemplateMapper;
    @Autowired private UserCouponMapper userCouponMapper;
    @Autowired private CouponOperationLogMapper couponOperationLogMapper;
    @Autowired private OrderCouponSnapshotMapper orderCouponSnapshotMapper;

    @Override public List<CouponTemplate> listAvailable(Long shopId) { return couponTemplateMapper.findAvailable(shopId); }

    @Override @Transactional
    public void claimCoupon(Long userId, Long templateId) {
        // Lock the template so the per-user limit is correct for concurrent claims.
        CouponTemplate t = couponTemplateMapper.findByIdForUpdate(templateId);
        if (t == null) throw new BusinessException("优惠券不存在");
        if (t.getStatus() != 1) throw new BusinessException("优惠券已停用");
        if (!isClaimableAt(t, LocalDateTime.now())) throw new BusinessException("优惠券不在可领取时间内");
        int perUserLimit = t.getPerUserLimit() == null ? 1 : t.getPerUserLimit();
        if (userCouponMapper.countByUserAndTemplate(userId, templateId) >= perUserLimit) {
            throw new BusinessException("已达到该优惠券的每人限领数量");
        }
        if (couponTemplateMapper.incrementIssuedCount(templateId) != 1) {
            throw new BusinessException("优惠券已领完或不在可领取时间内");
        }
        UserCoupon uc = new UserCoupon(); uc.setUserId(userId); uc.setCouponTemplateId(templateId); uc.setStatus(0);
        uc.setEffectiveStartTime(useStartTime(t));
        uc.setEffectiveEndTime(useEndTime(t));
        userCouponMapper.insert(uc);
        recordOperation(t.getId(), uc.getId(), userId, null, "CLAIM", "USER", userId, null);
    }

    @Override public List<UserCoupon> listMyCoupons(Long userId, Integer status) { return userCouponMapper.findByUserId(userId, status); }

    @Override
    public List<Map<String, Object>> listMyCouponViews(Long userId, Integer status) {
        List<Map<String, Object>> views = userCouponMapper.findViewsByUserId(userId, status);
        LocalDateTime now = LocalDateTime.now();
        for (Map<String, Object> view : views) {
            LocalDateTime startTime = (LocalDateTime) view.get("effectiveStartTime");
            LocalDateTime endTime = (LocalDateTime) view.get("effectiveEndTime");
            boolean started = startTime != null && !now.isBefore(startTime);
            boolean expired = endTime != null && now.isAfter(endTime);
            view.put("expired", expired);
            view.put("usable", started && !expired && Integer.valueOf(0).equals(view.get("userStatus"))
                    && Integer.valueOf(1).equals(view.get("templateStatus")));
        }
        return views;
    }

    @Override
    public List<Map<String, Object>> listUsableCouponsForOrder(Long userId, Long shopId, BigDecimal goodsAmount) {
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Map<String, Object> view : listMyCouponViews(userId, 0)) {
            Long templateId = ((Number) view.get("couponTemplateId")).longValue();
            CouponTemplate template = couponTemplateMapper.findById(templateId);
            if (template == null || !isUserCouponUsableAt(view, template, LocalDateTime.now())
                    || (template.getShopId() != null && !template.getShopId().equals(shopId))) {
                continue;
            }
            try {
                Map<String, Object> usable = new LinkedHashMap<>(view);
                usable.put("discountAmount", calculateDiscount(template, goodsAmount));
                usable.put("usable", true);
                result.add(usable);
            } catch (BusinessException ignored) {
                // A below-threshold coupon is intentionally absent from checkout candidates.
            }
        }
        return result;
    }

    @Override
    public List<CouponTemplate> listAllAvailable() {
        return couponTemplateMapper.findAllAvailable();
    }

    @Override
    @Transactional
    public BigDecimal lockCouponForOrder(
            Long userId, Long userCouponId, Long shopId, BigDecimal goodsAmount, String orderNo) {
        UserCoupon userCoupon = userCouponMapper.findByIdForUpdate(userCouponId);
        if (userCoupon == null || !userId.equals(userCoupon.getUserId())) {
            throw new BusinessException("优惠券不存在");
        }
        if (userCoupon.getStatus() != 0) {
            throw new BusinessException("优惠券当前不可使用");
        }
        CouponTemplate template = couponTemplateMapper.findById(userCoupon.getCouponTemplateId());
        if (template == null || template.getStatus() != 1
                || !isUserCouponUsableAt(userCoupon, template, LocalDateTime.now())) {
            throw new BusinessException("优惠券已失效");
        }
        if (template.getShopId() != null && !template.getShopId().equals(shopId)) {
            throw new BusinessException("优惠券不适用于当前店铺");
        }
        BigDecimal discount = calculateDiscount(template, goodsAmount);
        if (userCouponMapper.lockForOrder(userCouponId, userId, orderNo) != 1) {
            throw new BusinessException("优惠券状态已变化，请刷新后重试");
        }
        recordOperation(template.getId(), userCouponId, userId, orderNo, "LOCK", "SYSTEM", null, null);
        return discount;
    }

    @Override
    @Transactional
    public void consumeLockedCoupon(String orderNo) {
        UserCoupon userCoupon = userCouponMapper.findByIdForUpdateByOrderNo(orderNo);
        if (userCoupon == null) {
            throw new BusinessException("订单优惠券不存在或未锁定");
        }
        if (userCouponMapper.consumeLockedByOrderNo(orderNo) != 1) {
            throw new BusinessException("优惠券核销失败");
        }
        if (couponTemplateMapper.incrementUsedCount(userCoupon.getCouponTemplateId()) != 1) {
            throw new BusinessException("优惠券核销失败");
        }
        recordOperation(userCoupon.getCouponTemplateId(), userCoupon.getId(), userCoupon.getUserId(),
                orderNo, "USE", "SYSTEM", null, null);
    }

    @Override
    @Transactional
    public void releaseLockedCoupon(String orderNo) {
        UserCoupon userCoupon = userCouponMapper.findByIdForUpdateByOrderNo(orderNo);
        if (userCoupon != null && userCouponMapper.releaseLockedByOrderNo(orderNo) == 1) {
            recordOperation(userCoupon.getCouponTemplateId(), userCoupon.getId(), userCoupon.getUserId(),
                    orderNo, "RELEASE", "SYSTEM", null, null);
        }
    }

    @Override
    @Transactional
    public void recordOrderCouponSnapshot(Order order) {
        if (order.getCouponId() == null) {
            return;
        }
        UserCoupon userCoupon = userCouponMapper.findByOrderNo(order.getOrderNo());
        if (userCoupon == null) {
            throw new BusinessException("订单优惠券快照创建失败");
        }
        CouponTemplate template = couponTemplateMapper.findById(userCoupon.getCouponTemplateId());
        if (template == null) {
            throw new BusinessException("订单优惠券模板不存在");
        }
        OrderCouponSnapshot snapshot = new OrderCouponSnapshot();
        snapshot.setOrderId(order.getId()); snapshot.setOrderNo(order.getOrderNo());
        snapshot.setUserCouponId(userCoupon.getId()); snapshot.setCouponTemplateId(template.getId());
        snapshot.setShopId(template.getShopId()); snapshot.setCouponName(template.getName());
        snapshot.setCouponType(template.getType()); snapshot.setCouponAmount(template.getAmount());
        snapshot.setMinAmount(template.getMinAmount()); snapshot.setGoodsAmount(order.getTotalAmount());
        snapshot.setDiscountAmount(order.getDiscountAmount()); snapshot.setPayAmount(order.getPayAmount());
        orderCouponSnapshotMapper.insert(snapshot);
    }

    @Override
    @Transactional
    public int expireAvailableCoupons() {
        return userCouponMapper.expireAvailableCoupons();
    }

    /** Expires only unused coupons. Locked coupons remain governed by the order timeout transaction. */
    @Scheduled(fixedDelayString = "${mall.coupon.expire-scan-delay-ms:60000}")
    public void expireUnusedCouponsScheduled() {
        int expired = expireAvailableCoupons();
        if (expired > 0) {
            org.slf4j.LoggerFactory.getLogger(CouponServiceImpl.class)
                    .info("优惠券过期处理完成，过期数量: {}", expired);
        }
    }

    @Override
    public PageResult<CouponTemplate> listMerchantCoupons(
            Long shopId, String keyword, Integer status, Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 20 : Math.min(size, 200);
        if (status != null && status != 0 && status != 1) {
            throw new BusinessException("状态只能是 0 或 1");
        }
        List<CouponTemplate> all = couponTemplateMapper.findByShopIdAndCondition(
                shopId, keyword == null || keyword.isBlank() ? null : keyword.trim(), status);
        int from = Math.min((safePage - 1) * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        return new PageResult<>((long) all.size(), all.subList(from, to), safePage, safeSize);
    }

    @Override
    @Transactional
    public CouponTemplate createMerchantCoupon(Long shopId, MerchantCouponRequest request) {
        validateMerchantRequest(request);
        CouponTemplate coupon = new CouponTemplate();
        copyMerchantRequest(request, coupon);
        coupon.setShopId(shopId);
        coupon.setIssuedCount(0);
        coupon.setUsedCount(0);
        couponTemplateMapper.insert(coupon);
        return coupon;
    }

    @Override
    public CouponTemplate getMerchantCoupon(Long shopId, Long id) {
        return requireMerchantCoupon(shopId, id);
    }

    @Override
    @Transactional
    public void deleteMerchantCoupon(Long shopId, Long id) {
        CouponTemplate coupon = couponTemplateMapper.findByIdForUpdate(id);
        if (coupon == null || !shopId.equals(coupon.getShopId())) {
            throw new BusinessException("优惠券不存在");
        }
        if (userCouponMapper.countByTemplate(id) > 0
                || (coupon.getIssuedCount() != null && coupon.getIssuedCount() > 0)) {
            throw new BusinessException("已有用户领取的优惠券不能删除");
        }
        if (couponTemplateMapper.deleteById(id) != 1) {
            throw new BusinessException("优惠券删除失败");
        }
    }

    @Override
    @Transactional
    public void updateMerchantCoupon(Long shopId, Long id, MerchantCouponRequest request) {
        validateMerchantRequest(request);
        CouponTemplate coupon = requireMerchantCoupon(shopId, id);
        if (coupon.getIssuedCount() != null && coupon.getIssuedCount() > 0) {
            throw new BusinessException("已领取的优惠券不能修改规则，只能调整状态");
        }
        copyMerchantRequest(request, coupon);
        couponTemplateMapper.update(coupon);
    }

    @Override
    @Transactional
    public void updateMerchantCouponStatus(Long shopId, Long id, Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException("优惠券状态只能是 0 或 1");
        }
        CouponTemplate coupon = requireMerchantCoupon(shopId, id);
        coupon.setStatus(status);
        couponTemplateMapper.update(coupon);
    }

    @Override
    public Map<String, Object> merchantCouponStatistics(Long shopId, Long id) {
        requireMerchantCoupon(shopId, id);
        return couponStatistics(id);
    }

    @Override
    public List<Map<String, Object>> listMerchantCouponUsers(Long shopId, Long id) {
        requireMerchantCoupon(shopId, id);
        return userCouponMapper.findViewsByTemplateId(id);
    }

    @Override
    public CouponTemplate getCoupon(Long id) {
        CouponTemplate coupon = couponTemplateMapper.findById(id);
        if (coupon == null) throw new BusinessException("优惠券不存在");
        return coupon;
    }

    @Override
    public List<Map<String, Object>> listCouponOperations(Long id) {
        getCoupon(id);
        return couponOperationLogMapper.findByTemplateId(id);
    }

    @Override
    public Map<String, Object> couponStatistics(Long id) {
        CouponTemplate coupon = getCoupon(id);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("template", coupon);
        result.put("operations", couponOperationLogMapper.summarizeByTemplateId(id));
        return result;
    }

    private CouponTemplate requireMerchantCoupon(Long shopId, Long id) {
        CouponTemplate coupon = couponTemplateMapper.findById(id);
        if (coupon == null || !shopId.equals(coupon.getShopId())) {
            throw new BusinessException("优惠券不存在");
        }
        return coupon;
    }

    private static boolean isClaimableAt(CouponTemplate template, LocalDateTime now) {
        LocalDateTime start = template.getReceiveStartTime() == null ? template.getStartTime() : template.getReceiveStartTime();
        LocalDateTime end = template.getReceiveEndTime() == null ? template.getEndTime() : template.getReceiveEndTime();
        return start != null && end != null && !now.isBefore(start) && !now.isAfter(end);
    }

    private static boolean isUsableAt(CouponTemplate template, LocalDateTime now) {
        LocalDateTime start = useStartTime(template);
        LocalDateTime end = useEndTime(template);
        return start != null && end != null && !now.isBefore(start) && !now.isAfter(end);
    }

    /**
     * The effective window is fixed when a coupon is claimed, so subsequent template
     * adjustments cannot extend the use period of coupons already issued to users.
     */
    private static boolean isUserCouponUsableAt(UserCoupon userCoupon, CouponTemplate template, LocalDateTime now) {
        LocalDateTime start = userCoupon.getEffectiveStartTime() == null
                ? useStartTime(template) : userCoupon.getEffectiveStartTime();
        LocalDateTime end = userCoupon.getEffectiveEndTime() == null
                ? useEndTime(template) : userCoupon.getEffectiveEndTime();
        return start != null && end != null && !now.isBefore(start) && !now.isAfter(end);
    }

    private static boolean isUserCouponUsableAt(
            Map<String, Object> couponView, CouponTemplate template, LocalDateTime now) {
        LocalDateTime start = (LocalDateTime) couponView.get("effectiveStartTime");
        LocalDateTime end = (LocalDateTime) couponView.get("effectiveEndTime");
        if (start == null) start = useStartTime(template);
        if (end == null) end = useEndTime(template);
        return start != null && end != null && !now.isBefore(start) && !now.isAfter(end);
    }

    private static LocalDateTime useStartTime(CouponTemplate template) {
        return template.getUseStartTime() == null ? template.getStartTime() : template.getUseStartTime();
    }

    private static LocalDateTime useEndTime(CouponTemplate template) {
        return template.getUseEndTime() == null ? template.getEndTime() : template.getUseEndTime();
    }

    private static BigDecimal calculateDiscount(CouponTemplate template, BigDecimal goodsAmount) {
        BigDecimal minimum = template.getMinAmount() == null ? BigDecimal.ZERO : template.getMinAmount();
        if (goodsAmount.compareTo(minimum) < 0) {
            throw new BusinessException("订单金额未达到优惠券使用门槛");
        }
        BigDecimal discount = switch (template.getType()) {
            case 1, 3 -> template.getAmount();
            case 2 -> {
                if (template.getAmount().compareTo(BigDecimal.ZERO) <= 0
                        || template.getAmount().compareTo(new BigDecimal("100")) >= 0) {
                    throw new BusinessException("折扣券折扣值必须大于 0 且小于 100");
                }
                yield goodsAmount.multiply(new BigDecimal("100").subtract(template.getAmount()))
                        .movePointLeft(2).setScale(2, RoundingMode.HALF_UP);
            }
            default -> throw new BusinessException("优惠券类型不正确");
        };
        if (template.getMaxDiscountAmount() != null) {
            discount = discount.min(template.getMaxDiscountAmount());
        }
        return discount.min(goodsAmount).setScale(2, RoundingMode.HALF_UP);
    }

    private static void validateMerchantRequest(MerchantCouponRequest request) {
        if (request == null || request.getStartTime() == null || request.getEndTime() == null
                || !request.getEndTime().isAfter(request.getStartTime())) {
            throw new BusinessException("优惠券结束时间必须晚于开始时间");
        }
        if (request.getType() == 2 && request.getAmount().compareTo(new BigDecimal("100")) >= 0) {
            throw new BusinessException("折扣券折扣值必须小于 100");
        }
        validateCouponWindows(request.getStartTime(), request.getEndTime(), request.getReceiveStartTime(),
                request.getReceiveEndTime(), request.getUseStartTime(), request.getUseEndTime());
    }

    private static void copyMerchantRequest(MerchantCouponRequest request, CouponTemplate coupon) {
        coupon.setName(request.getName().trim());
        coupon.setType(request.getType());
        coupon.setAmount(request.getAmount());
        coupon.setMinAmount(request.getMinAmount());
        coupon.setTotalCount(request.getTotalCount());
        coupon.setStartTime(request.getStartTime());
        coupon.setEndTime(request.getEndTime());
        coupon.setReceiveStartTime(request.getReceiveStartTime());
        coupon.setReceiveEndTime(request.getReceiveEndTime());
        coupon.setUseStartTime(request.getUseStartTime());
        coupon.setUseEndTime(request.getUseEndTime());
        coupon.setPerUserLimit(request.getPerUserLimit() == null
                ? (coupon.getPerUserLimit() == null ? 1 : coupon.getPerUserLimit())
                : request.getPerUserLimit());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setStatus(request.getStatus());
    }

    private static void validateCouponWindows(LocalDateTime startTime, LocalDateTime endTime,
                                              LocalDateTime receiveStartTime, LocalDateTime receiveEndTime,
                                              LocalDateTime useStartTime, LocalDateTime useEndTime) {
        LocalDateTime claimStart = receiveStartTime == null ? startTime : receiveStartTime;
        LocalDateTime claimEnd = receiveEndTime == null ? endTime : receiveEndTime;
        LocalDateTime usableStart = useStartTime == null ? startTime : useStartTime;
        LocalDateTime usableEnd = useEndTime == null ? endTime : useEndTime;
        if (!claimEnd.isAfter(claimStart) || !usableEnd.isAfter(usableStart)) {
            throw new BusinessException("领取和使用结束时间必须晚于开始时间");
        }
    }

    private void recordOperation(Long templateId, Long userCouponId, Long userId, String orderNo,
                                 String operationType, String operatorType, Long operatorId, String reason) {
        CouponOperationLog log = new CouponOperationLog();
        log.setCouponTemplateId(templateId); log.setUserCouponId(userCouponId); log.setUserId(userId);
        log.setOrderNo(orderNo); log.setOperationType(operationType); log.setOperatorType(operatorType);
        log.setOperatorId(operatorId); log.setReason(reason);
        couponOperationLogMapper.insert(log);
    }
}
