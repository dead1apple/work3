package com.ngsz.mall_server.service.impl;

import cn.hutool.core.util.IdUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.*;
import com.ngsz.mall_server.pojo.*;
import com.ngsz.mall_server.service.PayService;
import com.ngsz.mall_server.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PayServiceImpl implements PayService {
    @Autowired private PaymentMapper paymentMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private OrderItemMapper orderItemMapper;
    @Autowired private SkuMapper skuMapper;
    @Autowired private SystemConfigService systemConfigService;
    @Value("${mall.pay.mock:true}") private boolean payMock;

    @Override
    @Transactional
    public Map<String, Object> createPayment(String orderNo, Integer payType, Long userId) {
        boolean mockEnabled = systemConfigService.isPayMockEnabled(payMock);
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) throw new BusinessException("订单不存在");
        Payment existing = paymentMapper.findByOrderNo(orderNo);
        if (order.getStatus() == 1 && existing != null && existing.getStatus() == 1) {
            return buildPaymentResult(existing, mockEnabled);
        }
        if (order.getStatus() != 0) throw new BusinessException("订单状态不允许支付");

        Payment payment;
        if (existing != null && existing.getStatus() == 0) {
            payment = existing;
        } else {
            payment = new Payment();
            payment.setPaymentNo("PAY" + IdUtil.getSnowflakeNextIdStr());
            payment.setOrderNo(orderNo); payment.setUserId(userId); payment.setPayType(payType);
            payment.setAmount(order.getPayAmount()); payment.setStatus(0);
            paymentMapper.insert(payment);
        }

        if (mockEnabled) completePayment(payment, order);
        return buildPaymentResult(payment, mockEnabled);
    }

    @Override @Transactional
    public void confirmPayment(String paymentNo, Long userId) {
        if (!systemConfigService.isPayMockEnabled(payMock)) {
            throw new BusinessException("模拟支付未启用");
        }
        Payment payment = paymentMapper.findByPaymentNo(paymentNo);
        if (payment == null || !payment.getUserId().equals(userId)) throw new BusinessException("支付单不存在");
        if (payment.getStatus() != 0) throw new BusinessException("支付单状态异常");
        Order order = orderMapper.findByOrderNo(payment.getOrderNo());
        completePayment(payment, order);
    }

    private void completePayment(Payment payment, Order order) {
        payment.setStatus(1); payment.setPayTime(LocalDateTime.now());
        payment.setThirdPartyNo("MOCK_" + IdUtil.fastSimpleUUID());
        paymentMapper.update(payment);
        if (order != null) {
            order.setStatus(1); order.setPayType(payment.getPayType()); order.setPayTime(LocalDateTime.now());
            orderMapper.update(order);
        }
        orderItemMapper.findByOrderNo(payment.getOrderNo()).forEach(i -> skuMapper.deductStock(i.getSkuId(), i.getQuantity()));
    }

    private Map<String, Object> buildPaymentResult(Payment payment, boolean mockEnabled) {
        Map<String, Object> result = new HashMap<>();
        result.put("payment", payment);
        result.put("paid", payment.getStatus() == 1);
        result.put("mock", mockEnabled);
        if (mockEnabled) result.put("mockTip", "模拟支付已完成");
        return result;
    }

    @Override
    public Map<String, Object> getPaymentStatus(String orderNo) {
        Map<String, Object> r = new HashMap<>();
        Payment p = paymentMapper.findByOrderNo(orderNo);
        r.put("payment", p); r.put("isPaid", p != null && p.getStatus() == 1);
        return r;
    }
}
