package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.OrderMapper;
import com.ngsz.mall_server.mapper.OrderItemMapper;
import com.ngsz.mall_server.mapper.PaymentMapper;
import com.ngsz.mall_server.mapper.ProductMapper;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.OrderItem;
import com.ngsz.mall_server.pojo.Payment;
import com.ngsz.mall_server.pojo.Product;
import com.ngsz.mall_server.pojo.dto.DeliverDTO;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderServiceImplTest {

    @Test
    void merchantCannotDeliverAnotherShopsOrder() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        Order order = new Order();
        order.setOrderNo("ORDER-1");
        order.setShopId(2L);
        order.setStatus(1);
        when(orderMapper.findByOrderNo("ORDER-1")).thenReturn(order);
        DeliverDTO dto = new DeliverDTO();
        dto.setOrderNo("ORDER-1");

        OrderServiceImpl service = new OrderServiceImpl();
        ReflectionTestUtils.setField(service, "orderMapper", orderMapper);

        assertThatThrownBy(() -> service.deliver(1L, dto))
                .isInstanceOf(BusinessException.class)
                .hasMessage("无权操作该订单");
        verify(orderMapper, never()).update(order);
    }

    @Test
    void merchantCannotReadAnotherShopsOrderDetail() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        Order order = new Order();
        order.setOrderNo("ORDER-2");
        order.setShopId(2L);
        when(orderMapper.findByOrderNo("ORDER-2")).thenReturn(order);
        OrderServiceImpl service = new OrderServiceImpl();
        ReflectionTestUtils.setField(service, "orderMapper", orderMapper);

        assertThatThrownBy(() -> service.getMerchantOrderDetail(1L, "ORDER-2"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("订单不存在");
    }

    @Test
    void merchantOrderDetailContainsItemsAndPayment() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        OrderItemMapper orderItemMapper = mock(OrderItemMapper.class);
        PaymentMapper paymentMapper = mock(PaymentMapper.class);
        Order order = new Order();
        order.setOrderNo("ORDER-3");
        order.setShopId(1L);
        OrderItem item = new OrderItem();
        Payment payment = new Payment();
        when(orderMapper.findByOrderNo("ORDER-3")).thenReturn(order);
        when(orderItemMapper.findByOrderNo("ORDER-3")).thenReturn(java.util.List.of(item));
        when(paymentMapper.findByOrderNo("ORDER-3")).thenReturn(payment);
        OrderServiceImpl service = new OrderServiceImpl();
        ReflectionTestUtils.setField(service, "orderMapper", orderMapper);
        ReflectionTestUtils.setField(service, "orderItemMapper", orderItemMapper);
        ReflectionTestUtils.setField(service, "paymentMapper", paymentMapper);

        var detail = service.getMerchantOrderDetail(1L, "ORDER-3");

        assertThat(detail.getOrder()).isSameAs(order);
        assertThat(detail.getItems()).containsExactly(item);
        assertThat(detail.getPayment()).isSameAs(payment);
    }

    @Test
    void orderDetailFallsBackToProductMainImageWhenSkuSnapshotIsEmpty() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        OrderItemMapper orderItemMapper = mock(OrderItemMapper.class);
        PaymentMapper paymentMapper = mock(PaymentMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        Order order = new Order();
        order.setOrderNo("ORDER-4");
        order.setShopId(1L);
        OrderItem item = new OrderItem();
        item.setProductId(9L);
        Product product = new Product();
        product.setMainImage("https://example.com/product.png");
        when(orderMapper.findByOrderNo("ORDER-4")).thenReturn(order);
        when(orderItemMapper.findByOrderNo("ORDER-4")).thenReturn(java.util.List.of(item));
        when(paymentMapper.findByOrderNo("ORDER-4")).thenReturn(null);
        when(productMapper.findById(9L)).thenReturn(product);
        OrderServiceImpl service = new OrderServiceImpl();
        ReflectionTestUtils.setField(service, "orderMapper", orderMapper);
        ReflectionTestUtils.setField(service, "orderItemMapper", orderItemMapper);
        ReflectionTestUtils.setField(service, "paymentMapper", paymentMapper);
        ReflectionTestUtils.setField(service, "productMapper", productMapper);

        var detail = service.getMerchantOrderDetail(1L, "ORDER-4");

        assertThat(detail.getItems().get(0).getSkuImage()).isEqualTo("https://example.com/product.png");
    }
}
