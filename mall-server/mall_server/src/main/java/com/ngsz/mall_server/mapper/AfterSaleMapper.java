package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.AfterSaleAttachment;
import com.ngsz.mall_server.pojo.AfterSaleMessage;
import com.ngsz.mall_server.pojo.AfterSaleOperationLog;
import com.ngsz.mall_server.pojo.AfterSaleTicket;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AfterSaleMapper {
    void insertTicket(AfterSaleTicket ticket);
    void insertAttachment(AfterSaleAttachment attachment);
    void insertMessage(AfterSaleMessage message);
    void insertOperation(@Param("ticketId") Long ticketId,
                         @Param("operatorId") Long operatorId,
                         @Param("operatorType") String operatorType,
                         @Param("operation") String operation,
                         @Param("beforeStatus") Integer beforeStatus,
                         @Param("afterStatus") Integer afterStatus,
                         @Param("reason") String reason);

    AfterSaleTicket findByTicketNo(@Param("ticketNo") String ticketNo);
    AfterSaleTicket findByTicketNoForUpdate(@Param("ticketNo") String ticketNo);
    AfterSaleTicket findByOrderItemId(@Param("orderItemId") Long orderItemId);
    List<AfterSaleTicket> findByUser(@Param("userId") Long userId, @Param("status") Integer status,
                                     @Param("offset") Integer offset, @Param("size") Integer size);
    int countByUser(@Param("userId") Long userId, @Param("status") Integer status);
    List<AfterSaleTicket> findByShop(@Param("shopId") Long shopId, @Param("status") Integer status,
                                     @Param("offset") Integer offset, @Param("size") Integer size);
    int countByShop(@Param("shopId") Long shopId, @Param("status") Integer status);
    List<AfterSaleTicket> findForPlatform(@Param("status") Integer status,
                                          @Param("offset") Integer offset, @Param("size") Integer size);
    int countForPlatform(@Param("status") Integer status);
    List<AfterSaleAttachment> findAttachments(@Param("ticketId") Long ticketId);
    List<AfterSaleMessage> findMessages(@Param("ticketId") Long ticketId);
    List<AfterSaleOperationLog> findOperationLogs(@Param("ticketId") Long ticketId);
    int updateWorkflow(@Param("id") Long id, @Param("status") Integer status,
                       @Param("rejectReason") String rejectReason,
                       @Param("finalResult") String finalResult,
                       @Param("close") boolean close);
}
