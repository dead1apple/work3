package com.ngsz.mall_server.service.impl;

import cn.hutool.core.util.IdUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.*;
import com.ngsz.mall_server.pojo.*;
import com.ngsz.mall_server.pojo.dto.*;
import com.ngsz.mall_server.pojo.vo.OrderDetailVO;
import com.ngsz.mall_server.service.CouponService;
import com.ngsz.mall_server.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Autowired private OrderMapper orderMapper;
    @Autowired private OrderItemMapper orderItemMapper;
    @Autowired private CartMapper cartMapper;
    @Autowired private SkuMapper skuMapper;
    @Autowired private ProductMapper productMapper;
    @Autowired private UserAddressMapper addressMapper;
    @Autowired private PaymentMapper paymentMapper;
    @Autowired private CouponService couponService;
    @Value("${mall.order.payment-timeout-minutes:30}")
    private long paymentTimeoutMinutes;
    @Value("${mall.order.timeout-scan-batch-size:100}")
    private int timeoutScanBatchSize;

    private String generateOrderNo() { return "JD" + IdUtil.getSnowflakeNextIdStr(); }

    @Override
    public Map<String, Object> previewOrder(Long userId, CreateOrderDTO dto) {
        List<Cart> selected = cartMapper.findByUserId(userId).stream()
                .filter(cart -> dto.getCartIds().contains(cart.getId()) && cart.getSelected() == 1).toList();
        if (selected.isEmpty()) throw new BusinessException("请选择要购买的商品");
        BigDecimal totalAmount = BigDecimal.ZERO;
        Long shopId = null;
        List<Map<String, Object>> items = new ArrayList<>();
        for (Cart cart : selected) {
            Sku sku = skuMapper.findById(cart.getSkuId());
            if (sku == null || sku.getStatus() != 1) throw new BusinessException("商品已下架");
            Product product = productMapper.findById(sku.getProductId());
            if (product == null || product.getShopId() == null) throw new BusinessException("商品所属店铺不存在");
            if (shopId == null) shopId = product.getShopId();
            else if (!shopId.equals(product.getShopId())) throw new BusinessException("一次结算只能选择同一店铺的商品");
            BigDecimal itemTotal = sku.getPrice().multiply(BigDecimal.valueOf(cart.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);
            items.add(Map.of("skuId", sku.getId(), "productId", product.getId(),
                    "quantity", cart.getQuantity(), "totalAmount", itemTotal));
        }
        List<Map<String, Object>> coupons = couponService.listUsableCouponsForOrder(userId, shopId, totalAmount);
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (dto.getCouponId() != null) {
            Map<String, Object> selectedCoupon = coupons.stream()
                    .filter(coupon -> dto.getCouponId().equals(((Number) coupon.get("userCouponId")).longValue()))
                    .findFirst().orElseThrow(() -> new BusinessException("优惠券当前不可用于该订单"));
            discountAmount = (BigDecimal) selectedCoupon.get("discountAmount");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shopId", shopId); result.put("items", items); result.put("totalAmount", totalAmount);
        result.put("freightAmount", BigDecimal.ZERO); result.put("coupons", coupons);
        result.put("discountAmount", discountAmount); result.put("payAmount", totalAmount.subtract(discountAmount));
        return result;
    }

    @Override @Transactional
    public Map<String, Object> createOrder(Long userId, CreateOrderDTO dto) {
        List<Cart> allCarts = cartMapper.findByUserId(userId);
        List<Cart> selected = allCarts.stream().filter(c -> dto.getCartIds().contains(c.getId()) && c.getSelected() == 1).toList();
        if (selected.isEmpty()) throw new BusinessException("请选择要购买的商品");
        UserAddress address = addressMapper.findById(dto.getAddressId());
        if (address == null) throw new BusinessException("收货地址不存在");
        String orderNo = generateOrderNo();
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        Order order = new Order();
        Long shopId = null;
        order.setOrderNo(orderNo); order.setUserId(userId);
        order.setReceiverName(address.getReceiverName()); order.setReceiverPhone(address.getReceiverPhone());
        order.setReceiverAddress(address.getProvince() + address.getCity() + address.getDistrict() + address.getDetailAddress());
        order.setRemark(dto.getRemark()); order.setStatus(0);
        order.setFreightAmount(BigDecimal.ZERO);
        for (Cart cart : selected) {
            Sku sku = skuMapper.findById(cart.getSkuId());
            if (sku == null || sku.getStatus() != 1) throw new BusinessException("商品已下架");
            if (skuMapper.lockStock(sku.getId(), cart.getQuantity()) != 1) {
                throw new BusinessException("库存不足: " + sku.getSkuName());
            }
            Product product = productMapper.findById(sku.getProductId());
            if (product == null || product.getShopId() == null) {
                throw new BusinessException("商品所属店铺不存在");
            }
            if (shopId == null) {
                shopId = product.getShopId();
            } else if (!shopId.equals(product.getShopId())) {
                throw new BusinessException("一次结算只能选择同一店铺的商品");
            }
            BigDecimal itemTotal = sku.getPrice().multiply(BigDecimal.valueOf(cart.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);
            OrderItem item = new OrderItem();
            item.setOrderNo(orderNo); item.setSkuId(sku.getId()); item.setProductId(sku.getProductId());
            item.setProductName(product != null ? product.getName() : ""); item.setSkuName(sku.getSkuName());
            item.setSkuImage(resolveOrderItemImage(sku, product)); item.setPrice(sku.getPrice()); item.setQuantity(cart.getQuantity());
            item.setTotalAmount(itemTotal);
            items.add(item);
        }
        BigDecimal discountAmount = dto.getCouponId() == null ? BigDecimal.ZERO
                : couponService.lockCouponForOrder(userId, dto.getCouponId(), shopId, totalAmount, orderNo);
        order.setShopId(shopId);
        order.setCouponId(dto.getCouponId());
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(totalAmount); order.setPayAmount(totalAmount.subtract(discountAmount));
        order.setPayDeadline(LocalDateTime.now().plusMinutes(paymentTimeoutMinutes));
        orderMapper.insert(order);
        couponService.recordOrderCouponSnapshot(order);
        items.forEach(item -> {
            item.setOrderId(order.getId());
            orderItemMapper.insert(item);
        });
        List<Long> cartIds = selected.stream().map(Cart::getId).collect(Collectors.toList());
        cartMapper.deleteByUserIdAndIds(userId, cartIds);
        Map<String, Object> result = new HashMap<>();
        result.put("order", order); result.put("items", orderItemMapper.findByOrderNo(orderNo));
        return result;
    }

    @Override @Transactional
    public Map<String, Object> buyNow(Long userId, BuyNowDTO dto) {
        Sku sku = skuMapper.findById(dto.getSkuId());
        if (sku == null || sku.getStatus() != 1) throw new BusinessException("商品已下架");
        UserAddress address = addressMapper.findById(dto.getAddressId());
        if (address == null) throw new BusinessException("收货地址不存在");
        if (skuMapper.lockStock(sku.getId(), dto.getQuantity()) != 1) {
            throw new BusinessException("库存不足");
        }
        String orderNo = generateOrderNo();
        Product product = productMapper.findById(sku.getProductId());
        if (product == null || product.getShopId() == null) {
            throw new BusinessException("商品所属店铺不存在");
        }
        BigDecimal itemTotal = sku.getPrice().multiply(BigDecimal.valueOf(dto.getQuantity()));
        Order order = new Order();
        order.setOrderNo(orderNo); order.setUserId(userId); order.setShopId(product.getShopId());
        order.setReceiverName(address.getReceiverName()); order.setReceiverPhone(address.getReceiverPhone());
        order.setReceiverAddress(address.getProvince() + address.getCity() + address.getDistrict() + address.getDetailAddress());
        order.setRemark(dto.getRemark()); order.setStatus(0);
        BigDecimal discountAmount = dto.getCouponId() == null ? BigDecimal.ZERO
                : couponService.lockCouponForOrder(
                        userId, dto.getCouponId(), order.getShopId(), itemTotal, orderNo);
        order.setFreightAmount(BigDecimal.ZERO); order.setCouponId(dto.getCouponId());
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(itemTotal); order.setPayAmount(itemTotal.subtract(discountAmount));
        order.setPayDeadline(LocalDateTime.now().plusMinutes(paymentTimeoutMinutes));
        orderMapper.insert(order);
        couponService.recordOrderCouponSnapshot(order);
        OrderItem item = new OrderItem();
        item.setOrderId(order.getId()); item.setOrderNo(orderNo); item.setSkuId(sku.getId()); item.setProductId(sku.getProductId());
        item.setProductName(product != null ? product.getName() : ""); item.setSkuName(sku.getSkuName());
        item.setSkuImage(resolveOrderItemImage(sku, product)); item.setPrice(sku.getPrice()); item.setQuantity(dto.getQuantity());
        item.setTotalAmount(itemTotal);
        orderItemMapper.insert(item);
        Map<String, Object> result = new HashMap<>();
        result.put("order", order); result.put("items", List.of(item));
        return result;
    }

    @Override
    public OrderDetailVO getOrderDetail(Long userId, String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) throw new BusinessException("订单不存在");
        return buildOrderDetail(order);
    }

    @Override
    public OrderDetailVO getMerchantOrderDetail(Long shopId, String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null || !Objects.equals(order.getShopId(), shopId)) {
            throw new BusinessException("订单不存在");
        }
        return buildOrderDetail(order);
    }

    @Override
    public PageResult<Order> listUserOrders(Long userId, Integer status, Integer page, Integer size) {
        int offset = (page - 1) * size;
        List<Order> orders = orderMapper.findByUserId(userId, status, offset, size);
        int total = orderMapper.countByUserId(userId, status);
        return new PageResult<>((long) total, orders, page, size);
    }

    @Override @Transactional
    public void cancelOrder(Long userId, String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) throw new BusinessException("订单不存在");
        Order lockedOrder = orderMapper.findByIdForUpdate(order.getId());
        if (lockedOrder == null || !lockedOrder.getUserId().equals(userId)) {
            throw new BusinessException("订单不存在");
        }
        cancelPendingOrder(lockedOrder, "用户主动取消");
    }

    @Override
    @Transactional
    public int cancelExpiredOrders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fallbackDeadline = now.minusMinutes(paymentTimeoutMinutes);
        List<Order> candidates = orderMapper.findExpiredUnpaid(now, fallbackDeadline, timeoutScanBatchSize);
        int cancelledCount = 0;
        for (Order candidate : candidates) {
            Order order = orderMapper.findByIdForUpdate(candidate.getId());
            if (order == null || order.getStatus() != 0 || !isExpired(order, now)) {
                continue;
            }
            cancelPendingOrder(order, "支付超时自动取消");
            cancelledCount++;
        }
        return cancelledCount;
    }

    @Override
    @Transactional
    public boolean cancelExpiredOrder(String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null) {
            return false;
        }
        Order lockedOrder = orderMapper.findByIdForUpdate(order.getId());
        LocalDateTime now = LocalDateTime.now();
        if (lockedOrder == null || lockedOrder.getStatus() != 0 || !isExpired(lockedOrder, now)) {
            return false;
        }
        cancelPendingOrder(lockedOrder, "支付超时自动取消");
        return true;
    }

    private void cancelPendingOrder(Order order, String reason) {
        if (order.getStatus() != 0) {
            throw new BusinessException("只能取消待付款的订单");
        }
        order.setStatus(4);
        order.setCancelTime(LocalDateTime.now());
        order.setCancelReason(reason);
        orderMapper.update(order);
        paymentMapper.expirePendingByOrderNo(order.getOrderNo());
        if (order.getCouponId() != null) {
            couponService.releaseLockedCoupon(order.getOrderNo());
        }
        orderItemMapper.findByOrderNo(order.getOrderNo()).forEach(item -> {
            if (skuMapper.unlockStock(item.getSkuId(), item.getQuantity()) != 1) {
                log.warn("跳过库存释放: orderNo={}, skuId={}, quantity={}", order.getOrderNo(), item.getSkuId(), item.getQuantity());
            }
        });
    }

    private boolean isExpired(Order order, LocalDateTime now) {
        if (order.getPayDeadline() != null) {
            return !order.getPayDeadline().isAfter(now);
        }
        return order.getCreateTime() != null
                && !order.getCreateTime().plusMinutes(paymentTimeoutMinutes).isAfter(now);
    }

    @Override
    public void confirmReceive(Long userId, String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) throw new BusinessException("订单不存在");
        if (order.getStatus() != 2) throw new BusinessException("订单状态不正确");
        order.setStatus(3); order.setReceiveTime(LocalDateTime.now());
        orderMapper.update(order);
    }

    @Override
    public void deleteOrder(Long userId, String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) throw new BusinessException("订单不存在");
        if (order.getStatus() == 1 || order.getStatus() == 2) throw new BusinessException("不能删除进行中的订单");
        order.setDeleted(1); orderMapper.update(order);
    }

    @Override
    public PageResult<Order> listOrders(String keyword, Integer status, Long shopId, Integer page, Integer size) {
        int offset = (page - 1) * size;
        List<Order> orders = orderMapper.findByCondition(keyword, status, shopId, offset, size);
        int total = orderMapper.countByCondition(keyword, status, shopId);
        return new PageResult<>((long) total, orders, page, size);
    }

    @Override @Transactional
    public void deliver(Long shopId, DeliverDTO dto) {
        Order order = orderMapper.findByOrderNo(dto.getOrderNo());
        if (order == null) throw new BusinessException("订单不存在");
        if (shopId == null || !shopId.equals(order.getShopId())) throw new BusinessException("无权操作该订单");
        if (order.getStatus() != 1) throw new BusinessException("只有待发货的订单才能发货");
        order.setStatus(2); order.setDeliveryTime(LocalDateTime.now());
        order.setLogisticsNo(dto.getLogisticsNo()); order.setLogisticsCompany(dto.getLogisticsCompany());
        orderMapper.update(order);
    }

    private OrderDetailVO buildOrderDetail(Order order) {
        List<OrderItem> items = orderItemMapper.findByOrderNo(order.getOrderNo());
        fillMissingOrderItemImages(items);
        return new OrderDetailVO(
                order,
                items,
                paymentMapper.findByOrderNo(order.getOrderNo()));
    }

    private String resolveOrderItemImage(Sku sku, Product product) {
        if (StringUtils.hasText(sku.getImage())) return sku.getImage();
        return product != null ? product.getMainImage() : null;
    }

    private void fillMissingOrderItemImages(List<OrderItem> items) {
        if (items == null) return;
        for (OrderItem item : items) {
            if (StringUtils.hasText(item.getSkuImage()) || item.getProductId() == null) continue;
            Product product = productMapper.findById(item.getProductId());
            if (product != null && StringUtils.hasText(product.getMainImage())) {
                item.setSkuImage(product.getMainImage());
            }
        }
    }
}
