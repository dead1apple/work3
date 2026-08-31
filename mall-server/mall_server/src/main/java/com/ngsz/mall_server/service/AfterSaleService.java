package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.AfterSaleTicket;
import com.ngsz.mall_server.pojo.dto.AfterSaleActionRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleAttachmentRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleMessageRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleRefundRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleResolveRequest;
import com.ngsz.mall_server.pojo.dto.CreateAfterSaleRequest;

import java.util.Map;

public interface AfterSaleService {
    void create(Long userId, CreateAfterSaleRequest request);
    PageResult<AfterSaleTicket> listMine(Long userId, Integer status, Integer page, Integer size);
    Map<String, Object> detailForUser(Long userId, String ticketNo);
    void addUserMessage(Long userId, String ticketNo, AfterSaleMessageRequest request);
    void addUserAttachments(Long userId, String ticketNo, AfterSaleAttachmentRequest request);
    void requestPlatform(Long userId, String ticketNo, AfterSaleActionRequest request);
    void cancel(Long userId, String ticketNo);
    void confirm(Long userId, String ticketNo);

    PageResult<AfterSaleTicket> listForMerchant(Long shopId, Integer status, Integer page, Integer size);
    Map<String, Object> detailForMerchant(Long shopId, String ticketNo);
    void addMerchantMessage(Long shopId, Long merchantUserId, String ticketNo, AfterSaleMessageRequest request);
    void approve(Long shopId, Long merchantUserId, String ticketNo, AfterSaleActionRequest request);
    void reject(Long shopId, Long merchantUserId, String ticketNo, AfterSaleActionRequest request);
    void requestInfo(Long shopId, Long merchantUserId, String ticketNo, AfterSaleActionRequest request);

    PageResult<AfterSaleTicket> listForPlatform(Integer status, Integer page, Integer size);
    Map<String, Object> detailForPlatform(String ticketNo);
    void addPlatformMessage(Long adminId, String ticketNo, AfterSaleMessageRequest request);
    void resolve(Long adminId, String ticketNo, AfterSaleResolveRequest request);
    void refundByPlatform(Long adminId, String ticketNo, AfterSaleRefundRequest request);
    void closeByPlatform(Long adminId, String ticketNo, AfterSaleActionRequest request);
}
