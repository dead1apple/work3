package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.dto.AdminBatchAuditRequest;
import com.ngsz.mall_server.pojo.dto.AdminCloseOrderRequest;
import com.ngsz.mall_server.pojo.dto.AdminDeliverRequest;
import com.ngsz.mall_server.pojo.dto.AdminRefundOrderRequest;

import java.util.Map;

public interface AdminPlatformService {

    Map<String, Object> dashboard(Integer days);

    PageResult<Map<String, Object>> listAudits(
            String type, String keyword, Integer page, Integer size);

    PageResult<Map<String, Object>> listAuditHistory(
            String type, Integer page, Integer size);

    void batchAudit(Long operatorId, AdminBatchAuditRequest request);

    void updateProductStatus(Long operatorId, Long id, Integer status);

    void updateShopStatus(Long operatorId, Long id, Integer status);

    Map<String, Object> userDetail(Long id);

    Map<String, Object> productDetail(Long id);

    Map<String, Object> shopDetail(Long id);

    Map<String, Object> orderDetail(String orderNo);

    void deliverOrder(String orderNo, AdminDeliverRequest request);

    void closeOrder(String orderNo, AdminCloseOrderRequest request);

    void refundOrder(Long operatorId, String orderNo, AdminRefundOrderRequest request);
}
