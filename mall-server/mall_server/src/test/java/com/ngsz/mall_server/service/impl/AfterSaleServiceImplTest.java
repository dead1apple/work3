package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.AfterSaleMapper;
import com.ngsz.mall_server.mapper.OrderItemMapper;
import com.ngsz.mall_server.mapper.OrderMapper;
import com.ngsz.mall_server.pojo.AfterSaleTicket;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.OrderItem;
import com.ngsz.mall_server.pojo.dto.AfterSaleActionRequest;
import com.ngsz.mall_server.pojo.dto.CreateAfterSaleRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AfterSaleServiceImplTest {

    @Mock private AfterSaleMapper afterSaleMapper;
    @Mock private OrderMapper orderMapper;
    @Mock private OrderItemMapper orderItemMapper;
    @InjectMocks private AfterSaleServiceImpl service;

    @Test
    void cannotCreateTicketForAnotherUsersOrder() {
        OrderItem item = item(4L, 9L);
        Order order = order(12L, 99L, 3);
        when(orderItemMapper.findById(4L)).thenReturn(item);
        when(orderMapper.findById(9L)).thenReturn(order);

        CreateAfterSaleRequest request = request(4L);

        assertThatThrownBy(() -> service.create(100L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("订单不存在");
        verify(afterSaleMapper, never()).insertTicket(any());
    }

    @Test
    void cannotCreateTicketForUnpaidOrder() {
        OrderItem item = item(4L, 9L);
        when(orderItemMapper.findById(4L)).thenReturn(item);
        when(orderMapper.findById(9L)).thenReturn(order(12L, 100L, 0));

        assertThatThrownBy(() -> service.create(100L, request(4L)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("当前订单状态不支持售后申请");
        verify(afterSaleMapper, never()).insertTicket(any());
    }

    @Test
    void createsMerchantOwnedTicketAndOperationLog() {
        OrderItem item = item(4L, 9L);
        when(orderItemMapper.findById(4L)).thenReturn(item);
        when(orderMapper.findById(9L)).thenReturn(order(12L, 100L, 3));
        when(afterSaleMapper.findByOrderItemId(4L)).thenReturn(null);

        service.create(100L, request(4L));

        verify(afterSaleMapper).insertTicket(any(AfterSaleTicket.class));
        verify(afterSaleMapper).insertOperation(any(), org.mockito.ArgumentMatchers.eq(100L),
                org.mockito.ArgumentMatchers.eq("USER"), org.mockito.ArgumentMatchers.eq("CREATE"),
                org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.eq(AfterSaleServiceImpl.WAIT_MERCHANT),
                org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void createsTicketWhenAttachmentsAreExplicitlyNull() {
        OrderItem item = item(4L, 9L);
        when(orderItemMapper.findById(4L)).thenReturn(item);
        when(orderMapper.findById(9L)).thenReturn(order(12L, 100L, 3));
        when(afterSaleMapper.findByOrderItemId(4L)).thenReturn(null);

        CreateAfterSaleRequest request = request(4L);
        request.setAttachments(null);

        service.create(100L, request);

        verify(afterSaleMapper).insertTicket(any(AfterSaleTicket.class));
        verify(afterSaleMapper, never()).insertAttachment(any());
    }

    @Test
    void merchantCannotOperateAnotherShopTicket() {
        AfterSaleTicket ticket = ticket("AS123", 7L, AfterSaleServiceImpl.WAIT_MERCHANT);
        when(afterSaleMapper.findByTicketNoForUpdate("AS123")).thenReturn(ticket);
        AfterSaleActionRequest request = new AfterSaleActionRequest();
        request.setReason("同意处理");

        assertThatThrownBy(() -> service.approve(8L, 88L, "AS123", request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("工单不存在");
        verify(afterSaleMapper, never()).updateWorkflow(any(), any(), any(), any(), anyBoolean());
    }

    @Test
    void rejectedTicketCanEnterPlatformProcessing() {
        AfterSaleTicket ticket = ticket("AS123", 7L, AfterSaleServiceImpl.REJECTED);
        ticket.setRejectReason("商家拒绝且未解决");
        when(afterSaleMapper.findByTicketNoForUpdate("AS123")).thenReturn(ticket);
        AfterSaleActionRequest request = new AfterSaleActionRequest();
        request.setReason("商家拒绝且未解决");
        when(afterSaleMapper.updateWorkflow(1L, AfterSaleServiceImpl.PLATFORM_PROCESSING,
                "商家拒绝且未解决", null, false)).thenReturn(1);

        service.requestPlatform(100L, "AS123", request);

        verify(afterSaleMapper).insertOperation(1L, 100L, "USER", "PLATFORM_REQUEST",
                AfterSaleServiceImpl.REJECTED, AfterSaleServiceImpl.PLATFORM_PROCESSING, "商家拒绝且未解决");
    }

    private static CreateAfterSaleRequest request(Long orderItemId) {
        CreateAfterSaleRequest request = new CreateAfterSaleRequest();
        request.setOrderItemId(orderItemId);
        request.setType("REFUND");
        request.setReasonType("QUALITY");
        request.setDescription("商品存在质量问题");
        return request;
    }

    private static OrderItem item(Long id, Long orderId) {
        OrderItem item = new OrderItem();
        item.setId(id);
        item.setOrderId(orderId);
        item.setProductId(20L);
        item.setSkuId(30L);
        return item;
    }

    private static Order order(Long id, Long userId, int status) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNo("ORDER-" + id);
        order.setUserId(userId);
        order.setShopId(7L);
        order.setStatus(status);
        return order;
    }

    private static AfterSaleTicket ticket(String ticketNo, Long shopId, int status) {
        AfterSaleTicket ticket = new AfterSaleTicket();
        ticket.setId(1L);
        ticket.setTicketNo(ticketNo);
        ticket.setShopId(shopId);
        ticket.setUserId(100L);
        ticket.setStatus(status);
        return ticket;
    }
}
