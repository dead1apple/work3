package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.OrderItemMapper;
import com.ngsz.mall_server.mapper.OrderMapper;
import com.ngsz.mall_server.mapper.PaymentMapper;
import com.ngsz.mall_server.mapper.SkuMapper;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.Payment;
import com.ngsz.mall_server.service.OrderService;
import com.ngsz.mall_server.service.SystemConfigService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayServiceImplTest {

    @Mock private PaymentMapper paymentMapper;
    @Mock private OrderMapper orderMapper;
    @Mock private OrderItemMapper orderItemMapper;
    @Mock private SkuMapper skuMapper;
    @Mock private OrderService orderService;
    @Mock private SystemConfigService systemConfigService;
    @InjectMocks private PayServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "payMock", true);
    }

    @Test
    void completesPaymentWhenRuntimeMockSwitchIsEnabled() {
        Order order = unpaidOrder();
        when(orderMapper.findByOrderNo("ORDER-1")).thenReturn(order);
        when(systemConfigService.isPayMockEnabled(true)).thenReturn(true);
        when(orderItemMapper.findByOrderNo("ORDER-1")).thenReturn(List.of());

        Map<String, Object> result = service.createPayment("ORDER-1", 1, 7L);

        assertThat(result.get("paid")).isEqualTo(true);
        assertThat(result.get("mock")).isEqualTo(true);
        verify(paymentMapper).update(any(Payment.class));
        verify(orderMapper).update(order);
    }

    @Test
    void leavesPaymentPendingWhenRuntimeMockSwitchIsDisabled() {
        Order order = unpaidOrder();
        when(orderMapper.findByOrderNo("ORDER-1")).thenReturn(order);
        when(systemConfigService.isPayMockEnabled(true)).thenReturn(false);

        Map<String, Object> result = service.createPayment("ORDER-1", 1, 7L);

        assertThat(result.get("paid")).isEqualTo(false);
        assertThat(result.get("mock")).isEqualTo(false);
        verify(paymentMapper, never()).update(any(Payment.class));
        verify(orderMapper, never()).update(any(Order.class));
    }

    @Test
    void rejectsManualMockConfirmationWhenRuntimeSwitchIsDisabled() {
        when(systemConfigService.isPayMockEnabled(true)).thenReturn(false);

        assertThatThrownBy(() -> service.confirmPayment("PAY-1", 7L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("模拟支付未启用");
    }

    @Test
    void rejectsPaymentAfterOrderDeadlineAndTriggersExpiration() {
        Order order = unpaidOrder();
        order.setId(1L);
        order.setPayDeadline(java.time.LocalDateTime.now().minusMinutes(1));
        when(orderMapper.findByOrderNo("ORDER-1")).thenReturn(order);
        when(orderMapper.findByIdForUpdate(1L)).thenReturn(order);
        when(systemConfigService.isPayMockEnabled(true)).thenReturn(false);
        when(orderService.cancelExpiredOrder("ORDER-1")).thenReturn(true);

        assertThatThrownBy(() -> service.createPayment("ORDER-1", 1, 7L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("订单支付已超时，请重新下单");
        verify(orderService).cancelExpiredOrder("ORDER-1");
    }

    private static Order unpaidOrder() {
        Order order = new Order();
        order.setOrderNo("ORDER-1");
        order.setUserId(7L);
        order.setStatus(0);
        order.setPayAmount(new BigDecimal("99.00"));
        return order;
    }
}
