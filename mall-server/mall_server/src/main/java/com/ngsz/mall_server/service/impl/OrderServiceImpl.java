package com.ngsz.mall_server.service.impl;

import cn.hutool.core.util.IdUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.*;
import com.ngsz.mall_server.pojo.*;
import com.ngsz.mall_server.pojo.dto.*;
import com.ngsz.mall_server.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {
    @Autowired private OrderMapper orderMapper;
    @Autowired private OrderItemMapper orderItemMapper;
    @Autowired private CartMapper cartMapper;
    @Autowired private SkuMapper skuMapper;
    @Autowired private ProductMapper productMapper;
    @Autowired private UserAddressMapper addressMapper;
    @Autowired private PaymentMapper paymentMapper;

    private String generateOrderNo() { return "JD" + IdUtil.getSnowflakeNextIdStr(); }

    @Override @Transactional
    public Map<String, Object> createOrder(Long userId, CreateOrderDTO dto) {
        List<Cart> allCarts = cartMapper.findByUserId(userId);
        List<Cart> selected = allCarts.stream().filter(c -> dto.getCartIds().contains(c.getId()) && c.getSelected() == 1).toList();
        if (selected.isEmpty()) throw new BusinessException("请选择要购买的商品");
        UserAddress address = addressMapper.findById(dto.getAddressId());
        if (address == null) throw new BusinessException("收货地址不存在");
        String orderNo = generateOrderNo();
        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = new Order();
        order.setOrderNo(orderNo); order.setUserId(userId); order.setShopId(1L);
        order.setReceiverName(address.getReceiverName()); order.setReceiverPhone(address.getReceiverPhone());
        order.setReceiverAddress(address.getProvince() + address.getCity() + address.getDistrict() + address.getDetailAddress());
        order.setRemark(dto.getRemark()); order.setStatus(0);
        order.setFreightAmount(BigDecimal.ZERO); order.setDiscountAmount(BigDecimal.ZERO); order.setCouponId(dto.getCouponId());
        for (Cart cart : selected) {
            Sku sku = skuMapper.findById(cart.getSkuId());
            if (sku == null || sku.getStatus() != 1) throw new BusinessException("商品已下架");
            if (sku.getStock() - sku.getLockedStock() < cart.getQuantity()) throw new BusinessException("库存不足: " + sku.getSkuName());
            skuMapper.lockStock(sku.getId(), cart.getQuantity());
            Product product = productMapper.findById(sku.getProductId());
            BigDecimal itemTotal = sku.getPrice().multiply(BigDecimal.valueOf(cart.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);
            OrderItem item = new OrderItem();
            item.setOrderNo(orderNo); item.setSkuId(sku.getId()); item.setProductId(sku.getProductId());
            item.setProductName(product != null ? product.getName() : ""); item.setSkuName(sku.getSkuName());
            item.setSkuImage(sku.getImage()); item.setPrice(sku.getPrice()); item.setQuantity(cart.getQuantity());
            item.setTotalAmount(itemTotal);
            orderItemMapper.insert(item);
        }
        order.setTotalAmount(totalAmount); order.setPayAmount(totalAmount);
        orderMapper.insert(order);
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
        if (sku.getStock() - sku.getLockedStock() < dto.getQuantity()) throw new BusinessException("库存不足");
        UserAddress address = addressMapper.findById(dto.getAddressId());
        if (address == null) throw new BusinessException("收货地址不存在");
        skuMapper.lockStock(sku.getId(), dto.getQuantity());
        String orderNo = generateOrderNo();
        Product product = productMapper.findById(sku.getProductId());
        BigDecimal itemTotal = sku.getPrice().multiply(BigDecimal.valueOf(dto.getQuantity()));
        Order order = new Order();
        order.setOrderNo(orderNo); order.setUserId(userId); order.setShopId(product != null ? product.getShopId() : 1L);
        order.setReceiverName(address.getReceiverName()); order.setReceiverPhone(address.getReceiverPhone());
        order.setReceiverAddress(address.getProvince() + address.getCity() + address.getDistrict() + address.getDetailAddress());
        order.setRemark(dto.getRemark()); order.setStatus(0);
        order.setFreightAmount(BigDecimal.ZERO); order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(itemTotal); order.setPayAmount(itemTotal);
        orderMapper.insert(order);
        OrderItem item = new OrderItem();
        item.setOrderId(order.getId()); item.setOrderNo(orderNo); item.setSkuId(sku.getId()); item.setProductId(sku.getProductId());
        item.setProductName(product != null ? product.getName() : ""); item.setSkuName(sku.getSkuName());
        item.setSkuImage(sku.getImage()); item.setPrice(sku.getPrice()); item.setQuantity(dto.getQuantity());
        item.setTotalAmount(itemTotal);
        orderItemMapper.insert(item);
        Map<String, Object> result = new HashMap<>();
        result.put("order", order); result.put("items", List.of(item));
        return result;
    }

    @Override
    public Map<String, Object> getOrderDetail(Long userId, String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) throw new BusinessException("订单不存在");
        Map<String, Object> result = new HashMap<>();
        result.put("order", order); result.put("items", orderItemMapper.findByOrderNo(orderNo));
        result.put("payment", paymentMapper.findByOrderNo(orderNo));
        return result;
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
        if (order.getStatus() != 0) throw new BusinessException("只能取消待付款的订单");
        order.setStatus(4); order.setCancelTime(LocalDateTime.now()); order.setCancelReason("用户主动取消");
        orderMapper.update(order);
        orderItemMapper.findByOrderNo(orderNo).forEach(i -> skuMapper.unlockStock(i.getSkuId(), i.getQuantity()));
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
    public void deliver(DeliverDTO dto) {
        Order order = orderMapper.findByOrderNo(dto.getOrderNo());
        if (order == null) throw new BusinessException("订单不存在");
        if (order.getStatus() != 1) throw new BusinessException("只有待发货的订单才能发货");
        order.setStatus(2); order.setDeliveryTime(LocalDateTime.now());
        order.setLogisticsNo(dto.getLogisticsNo()); order.setLogisticsCompany(dto.getLogisticsCompany());
        orderMapper.update(order);
    }
}
