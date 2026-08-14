package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.mapper.OrderItemMapper;
import com.ngsz.mall_server.mapper.OrderMapper;
import com.ngsz.mall_server.mapper.PaymentMapper;
import com.ngsz.mall_server.mapper.SkuMapper;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.OrderItem;
import com.ngsz.mall_server.pojo.Payment;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayServiceImplTest {

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private OrderItemMapper orderItemMapper;

    @Mock
    private SkuMapper skuMapper;

    @InjectMocks
    private PayServiceImpl payService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(payService, "payMock", true);
    }

    @Test
    void createPaymentCompletesOrderImmediatelyInMockMode() {
        Order order = new Order();
        order.setOrderNo("JD1001");
        order.setUserId(3L);
        order.setStatus(0);
        order.setPayAmount(new BigDecimal("199.00"));

        OrderItem item = new OrderItem();
        item.setSkuId(10L);
        item.setQuantity(2);

        when(orderMapper.findByOrderNo("JD1001")).thenReturn(order);
        when(paymentMapper.findByOrderNo("JD1001")).thenReturn(null);
        when(orderItemMapper.findByOrderNo("JD1001")).thenReturn(List.of(item));

        Map<String, Object> result = payService.createPayment("JD1001", 1, 3L);

        Payment payment = (Payment) result.get("payment");
        assertThat(payment.getStatus()).isEqualTo(1);
        assertThat(payment.getThirdPartyNo()).startsWith("MOCK_");
        assertThat(result.get("paid")).isEqualTo(true);
        assertThat(result.get("mock")).isEqualTo(true);
        assertThat(order.getStatus()).isEqualTo(1);
        verify(paymentMapper).update(payment);
        verify(orderMapper).update(order);
        verify(skuMapper).deductStock(10L, 2);
    }

    @Test
    void createPaymentReturnsExistingSuccessWithoutChargingAgain() {
        Order order = new Order();
        order.setOrderNo("JD1002");
        order.setUserId(3L);
        order.setStatus(1);

        Payment payment = new Payment();
        payment.setPaymentNo("PAY1002");
        payment.setOrderNo("JD1002");
        payment.setUserId(3L);
        payment.setStatus(1);
        payment.setThirdPartyNo("MOCK_existing");

        when(orderMapper.findByOrderNo("JD1002")).thenReturn(order);
        when(paymentMapper.findByOrderNo("JD1002")).thenReturn(payment);

        Map<String, Object> result = payService.createPayment("JD1002", 1, 3L);

        assertThat(result.get("payment")).isSameAs(payment);
        assertThat(result.get("paid")).isEqualTo(true);
        verify(paymentMapper, never()).insert(payment);
        verify(paymentMapper, never()).update(payment);
        verify(orderMapper, never()).update(order);
        verifyNoInteractions(orderItemMapper, skuMapper);
    }
}
