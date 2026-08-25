package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.OrderMapper;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.dto.DeliverDTO;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
}
