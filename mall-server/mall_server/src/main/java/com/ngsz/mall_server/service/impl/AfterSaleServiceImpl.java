package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.AfterSaleMapper;
import com.ngsz.mall_server.mapper.OrderItemMapper;
import com.ngsz.mall_server.mapper.OrderMapper;
import com.ngsz.mall_server.pojo.AfterSaleAttachment;
import com.ngsz.mall_server.pojo.AfterSaleMessage;
import com.ngsz.mall_server.pojo.AfterSaleTicket;
import com.ngsz.mall_server.pojo.Order;
import com.ngsz.mall_server.pojo.OrderItem;
import com.ngsz.mall_server.pojo.dto.AfterSaleActionRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleAttachmentRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleMessageRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleRefundRequest;
import com.ngsz.mall_server.pojo.dto.AfterSaleResolveRequest;
import com.ngsz.mall_server.pojo.dto.CreateAfterSaleRequest;
import com.ngsz.mall_server.pojo.dto.AdminRefundOrderRequest;
import com.ngsz.mall_server.service.AdminPlatformService;
import com.ngsz.mall_server.service.AfterSaleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AfterSaleServiceImpl implements AfterSaleService {
    // Keep workflow values stable because they are persisted in the database.
    static final int WAIT_MERCHANT = 0;
    static final int MERCHANT_PROCESSING = 1;
    static final int WAIT_USER_INFO = 2;
    static final int WAIT_USER_CONFIRM = 3;
    static final int PLATFORM_PROCESSING = 4;
    static final int RESOLVED = 5;
    static final int CLOSED = 6;
    static final int REJECTED = 7;
    static final int CANCELLED = 8;

    private static final List<String> TYPES = List.of("REFUND", "RETURN_REFUND", "EXCHANGE", "RESEND");
    private static final List<String> REASONS = List.of("QUALITY", "DAMAGED", "WRONG_OR_MISSING", "LOGISTICS", "OTHER");

    private final AfterSaleMapper afterSaleMapper;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final AdminPlatformService adminPlatformService;

    public AfterSaleServiceImpl(AfterSaleMapper afterSaleMapper,
                                OrderMapper orderMapper,
                                OrderItemMapper orderItemMapper,
                                AdminPlatformService adminPlatformService) {
        this.afterSaleMapper = afterSaleMapper;
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.adminPlatformService = adminPlatformService;
    }

    @Override
    @Transactional
    public void create(Long userId, CreateAfterSaleRequest request) {
        if (request == null) throw new BusinessException("售后申请不能为空");
        String type = normalizeEnum(request.getType(), TYPES, "售后类型不正确");
        String reasonType = normalizeEnum(request.getReasonType(), REASONS, "问题类型不正确");
        String description = required(request.getDescription(), "问题描述不能为空");
        OrderItem item = orderItemMapper.findById(request.getOrderItemId());
        if (item == null) throw new BusinessException("订单明细不存在");
        Order order = orderMapper.findById(item.getOrderId());
        if (order == null || !userId.equals(order.getUserId())) throw new BusinessException("订单不存在");
        if (order.getStatus() == null || (order.getStatus() != 1 && order.getStatus() != 2 && order.getStatus() != 3)) {
            throw new BusinessException("当前订单状态不支持售后申请");
        }
        if (afterSaleMapper.findByOrderItemId(item.getId()) != null) {
            throw new BusinessException("该订单商品已经提交过售后工单");
        }

        AfterSaleTicket ticket = new AfterSaleTicket();
        ticket.setTicketNo("AS" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        ticket.setUserId(userId); ticket.setShopId(order.getShopId()); ticket.setOrderId(order.getId());
        ticket.setOrderNo(order.getOrderNo()); ticket.setOrderItemId(item.getId());
        ticket.setProductId(item.getProductId()); ticket.setSkuId(item.getSkuId());
        ticket.setType(type); ticket.setReasonType(reasonType); ticket.setDescription(description);
        ticket.setStatus(WAIT_MERCHANT);
        afterSaleMapper.insertTicket(ticket);
        afterSaleMapper.insertOperation(ticket.getId(), userId, "USER", "CREATE", null, WAIT_MERCHANT, description);
        List<CreateAfterSaleRequest.AttachmentRequest> attachments = request.getAttachments() == null
                ? List.of() : request.getAttachments();
        for (CreateAfterSaleRequest.AttachmentRequest source : attachments) {
            if (source == null) throw new BusinessException("附件信息不完整");
            validateAttachment(source.getUrl(), source.getObjectKey(), source.getFileName(), source.getFileSize());
            AfterSaleAttachment attachment = new AfterSaleAttachment();
            attachment.setTicketId(ticket.getId()); attachment.setUserId(userId);
            attachment.setUrl(source.getUrl().trim()); attachment.setObjectKey(source.getObjectKey().trim());
            attachment.setFileName(source.getFileName()); attachment.setFileSize(source.getFileSize());
            afterSaleMapper.insertAttachment(attachment);
        }
    }

    @Override
    public PageResult<AfterSaleTicket> listMine(Long userId, Integer status, Integer page, Integer size) {
        Bounds bounds = bounds(page, size);
        return new PageResult<>((long) afterSaleMapper.countByUser(userId, status),
                afterSaleMapper.findByUser(userId, status, bounds.offset(), bounds.size()), bounds.page(), bounds.size());
    }

    @Override
    public Map<String, Object> detailForUser(Long userId, String ticketNo) {
        AfterSaleTicket ticket = requireTicket(ticketNo);
        if (!userId.equals(ticket.getUserId())) throw new BusinessException("工单不存在");
        return detail(ticket);
    }

    @Override
    @Transactional
    public void addUserMessage(Long userId, String ticketNo, AfterSaleMessageRequest request) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (!userId.equals(ticket.getUserId())) throw new BusinessException("工单不存在");
        ensureOpen(ticket);
        addMessage(ticket, userId, "USER", request);
        if (ticket.getStatus() == WAIT_USER_INFO) transition(ticket, userId, "USER", "SUBMIT_INFO", MERCHANT_PROCESSING, request.getContent());
    }

    @Override
    @Transactional
    public void addUserAttachments(Long userId, String ticketNo, AfterSaleAttachmentRequest request) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (!userId.equals(ticket.getUserId())) throw new BusinessException("工单不存在");
        ensureOpen(ticket);
        if (request == null || request.getAttachments() == null || request.getAttachments().isEmpty()) {
            throw new BusinessException("补充附件不能为空");
        }
        int existingCount = afterSaleMapper.countAttachments(ticket.getId());
        if (existingCount + request.getAttachments().size() > 9) {
            throw new BusinessException("单个工单最多 9 个附件");
        }
        for (AfterSaleAttachmentRequest.Attachment source : request.getAttachments()) {
            if (source == null) throw new BusinessException("附件信息不完整");
            validateAttachment(source.getUrl(), source.getObjectKey(), source.getFileName(), source.getFileSize());
            AfterSaleAttachment attachment = new AfterSaleAttachment();
            attachment.setTicketId(ticket.getId());
            attachment.setUserId(userId);
            attachment.setUrl(source.getUrl().trim());
            attachment.setObjectKey(source.getObjectKey().trim());
            attachment.setFileName(source.getFileName());
            attachment.setFileSize(source.getFileSize());
            afterSaleMapper.insertAttachment(attachment);
        }
        if (ticket.getStatus() == WAIT_USER_INFO) {
            transition(ticket, userId, "USER", "SUBMIT_INFO", MERCHANT_PROCESSING, "用户补充售后附件");
        }
    }

    @Override
    @Transactional
    public void requestPlatform(Long userId, String ticketNo, AfterSaleActionRequest request) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (!userId.equals(ticket.getUserId())) throw new BusinessException("工单不存在");
        required(request == null ? null : request.getReason(), "申请原因不能为空");
        if (ticket.getStatus() != REJECTED) {
            throw new BusinessException("商家拒绝后才能申请平台介入");
        }
        transition(ticket, userId, "USER", "PLATFORM_REQUEST", PLATFORM_PROCESSING, request.getReason());
    }

    @Override
    @Transactional
    public void cancel(Long userId, String ticketNo) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (!userId.equals(ticket.getUserId())) throw new BusinessException("工单不存在");
        if (ticket.getStatus() != WAIT_MERCHANT && ticket.getStatus() != WAIT_USER_INFO) {
            throw new BusinessException("当前工单不能取消");
        }
        transition(ticket, userId, "USER", "CANCEL", CANCELLED, "用户主动取消售后申请");
    }

    @Override
    @Transactional
    public void confirm(Long userId, String ticketNo) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (!userId.equals(ticket.getUserId())) throw new BusinessException("工单不存在");
        if (ticket.getStatus() != WAIT_USER_CONFIRM && ticket.getStatus() != RESOLVED) {
            throw new BusinessException("当前工单等待处理，不能确认关闭");
        }
        transition(ticket, userId, "USER", "CONFIRM", CLOSED, "用户确认处理结果");
    }

    @Override
    public PageResult<AfterSaleTicket> listForMerchant(Long shopId, Integer status, Integer page, Integer size) {
        Bounds bounds = bounds(page, size);
        return new PageResult<>((long) afterSaleMapper.countByShop(shopId, status),
                afterSaleMapper.findByShop(shopId, status, bounds.offset(), bounds.size()), bounds.page(), bounds.size());
    }

    @Override
    public Map<String, Object> detailForMerchant(Long shopId, String ticketNo) {
        AfterSaleTicket ticket = requireTicket(ticketNo);
        if (!shopId.equals(ticket.getShopId())) throw new BusinessException("工单不存在");
        return detail(ticket);
    }

    @Override
    @Transactional
    public void addMerchantMessage(Long shopId, Long merchantUserId, String ticketNo, AfterSaleMessageRequest request) {
        AfterSaleTicket ticket = merchantTicketForUpdate(shopId, ticketNo);
        ensureOpen(ticket);
        addMessage(ticket, merchantUserId, "MERCHANT", request);
        if (ticket.getStatus() == WAIT_MERCHANT) transition(ticket, merchantUserId, "MERCHANT", "REPLY", MERCHANT_PROCESSING, request.getContent());
    }

    @Override
    @Transactional
    public void approve(Long shopId, Long merchantUserId, String ticketNo, AfterSaleActionRequest request) {
        AfterSaleTicket ticket = merchantTicketForUpdate(shopId, ticketNo);
        String reason = required(request == null ? null : request.getReason(), "处理原因不能为空");
        if (ticket.getStatus() != WAIT_MERCHANT && ticket.getStatus() != MERCHANT_PROCESSING) {
            throw new BusinessException("当前工单不能同意售后");
        }
        transition(ticket, merchantUserId, "MERCHANT", "APPROVE", WAIT_USER_CONFIRM, reason);
    }

    @Override
    @Transactional
    public void reject(Long shopId, Long merchantUserId, String ticketNo, AfterSaleActionRequest request) {
        AfterSaleTicket ticket = merchantTicketForUpdate(shopId, ticketNo);
        String reason = required(request == null ? null : request.getReason(), "拒绝原因不能为空");
        if (ticket.getStatus() != WAIT_MERCHANT && ticket.getStatus() != MERCHANT_PROCESSING) {
            throw new BusinessException("当前工单不能拒绝");
        }
        transition(ticket, merchantUserId, "MERCHANT", "REJECT", REJECTED, reason);
    }

    @Override
    @Transactional
    public void requestInfo(Long shopId, Long merchantUserId, String ticketNo, AfterSaleActionRequest request) {
        AfterSaleTicket ticket = merchantTicketForUpdate(shopId, ticketNo);
        String reason = required(request == null ? null : request.getReason(), "补充材料说明不能为空");
        if (ticket.getStatus() != WAIT_MERCHANT && ticket.getStatus() != MERCHANT_PROCESSING) {
            throw new BusinessException("当前工单不能要求补充材料");
        }
        transition(ticket, merchantUserId, "MERCHANT", "REQUEST_INFO", WAIT_USER_INFO, reason);
    }

    @Override
    public PageResult<AfterSaleTicket> listForPlatform(Integer status, Integer page, Integer size) {
        Bounds bounds = bounds(page, size);
        return new PageResult<>((long) afterSaleMapper.countForPlatform(status),
                afterSaleMapper.findForPlatform(status, bounds.offset(), bounds.size()), bounds.page(), bounds.size());
    }

    @Override
    public Map<String, Object> detailForPlatform(String ticketNo) {
        return detail(requireTicket(ticketNo));
    }

    @Override
    @Transactional
    public void addPlatformMessage(Long adminId, String ticketNo, AfterSaleMessageRequest request) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (ticket.getStatus() == CLOSED || ticket.getStatus() == CANCELLED) throw new BusinessException("工单已关闭");
        addMessage(ticket, adminId, "PLATFORM", request);
        if (ticket.getStatus() == REJECTED || ticket.getStatus() == WAIT_MERCHANT) {
            transition(ticket, adminId, "PLATFORM", "TAKE_OVER", PLATFORM_PROCESSING, request.getContent());
        }
    }

    @Override
    @Transactional
    public void resolve(Long adminId, String ticketNo, AfterSaleResolveRequest request) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        String result = required(request == null ? null : request.getResult(), "处理结果不能为空");
        if (ticket.getStatus() != PLATFORM_PROCESSING && ticket.getStatus() != REJECTED) {
            throw new BusinessException("当前工单不能由平台处理");
        }
        transition(ticket, adminId, "PLATFORM", "RESOLVE", RESOLVED, result);
    }

    @Override
    @Transactional
    public void refundByPlatform(Long adminId, String ticketNo, AfterSaleRefundRequest request) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (ticket.getStatus() != PLATFORM_PROCESSING && ticket.getStatus() != REJECTED) {
            throw new BusinessException("当前工单不能执行平台退款");
        }
        if (request == null || request.getAmount() == null
                || request.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new BusinessException("退款金额必须大于 0");
        }
        String reason = required(request.getReason(), "退款原因不能为空");
        OrderItem item = orderItemMapper.findById(ticket.getOrderItemId());
        if (item == null || item.getTotalAmount() == null) {
            throw new BusinessException("订单明细不存在或金额异常");
        }
        if (request.getAmount().compareTo(item.getTotalAmount()) > 0) {
            throw new BusinessException("退款金额不能超过当前售后商品金额");
        }
        AdminRefundOrderRequest refundRequest = new AdminRefundOrderRequest();
        refundRequest.setAmount(request.getAmount());
        refundRequest.setReason(reason);
        adminPlatformService.refundOrder(adminId, ticket.getOrderNo(), refundRequest);
        transition(ticket, adminId, "PLATFORM", "REFUND", RESOLVED, reason);
    }

    @Override
    @Transactional
    public void closeByPlatform(Long adminId, String ticketNo, AfterSaleActionRequest request) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        String reason = required(request == null ? null : request.getReason(), "关闭原因不能为空");
        if (ticket.getStatus() == CLOSED) throw new BusinessException("工单已关闭");
        transition(ticket, adminId, "PLATFORM", "CLOSE", CLOSED, reason);
    }

    private void addMessage(AfterSaleTicket ticket, Long senderId, String senderType, AfterSaleMessageRequest request) {
        String content = required(request == null ? null : request.getContent(), "留言内容不能为空");
        AfterSaleMessage message = new AfterSaleMessage();
        message.setTicketId(ticket.getId()); message.setSenderId(senderId);
        message.setSenderType(senderType); message.setContent(content);
        afterSaleMapper.insertMessage(message);
    }

    private void transition(AfterSaleTicket ticket, Long operatorId, String operatorType,
                            String operation, int afterStatus, String reason) {
        int before = ticket.getStatus();
        if (afterSaleMapper.updateWorkflow(ticket.getId(), afterStatus,
                afterStatus == REJECTED ? reason : ticket.getRejectReason(),
                afterStatus == RESOLVED ? reason : ticket.getFinalResult(),
                afterStatus == CLOSED || afterStatus == CANCELLED) != 1) {
            throw new BusinessException("工单状态已变化，请刷新后重试");
        }
        afterSaleMapper.insertOperation(ticket.getId(), operatorId, operatorType, operation, before, afterStatus, reason);
        ticket.setStatus(afterStatus);
    }

    private Map<String, Object> detail(AfterSaleTicket ticket) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ticket", ticket);
        result.put("attachments", afterSaleMapper.findAttachments(ticket.getId()));
        result.put("messages", afterSaleMapper.findMessages(ticket.getId()));
        result.put("operationLogs", afterSaleMapper.findOperationLogs(ticket.getId()));
        result.put("orderItem", orderItemMapper.findById(ticket.getOrderItemId()));
        return result;
    }

    private AfterSaleTicket merchantTicket(Long shopId, String ticketNo) {
        AfterSaleTicket ticket = requireTicket(ticketNo);
        if (!shopId.equals(ticket.getShopId())) throw new BusinessException("工单不存在");
        return ticket;
    }

    private AfterSaleTicket merchantTicketForUpdate(Long shopId, String ticketNo) {
        AfterSaleTicket ticket = requireTicketForUpdate(ticketNo);
        if (!shopId.equals(ticket.getShopId())) throw new BusinessException("工单不存在");
        return ticket;
    }

    private AfterSaleTicket requireTicket(String ticketNo) {
        String value = required(ticketNo, "工单号不能为空");
        AfterSaleTicket ticket = afterSaleMapper.findByTicketNo(value);
        if (ticket == null) throw new BusinessException("工单不存在");
        return ticket;
    }

    private AfterSaleTicket requireTicketForUpdate(String ticketNo) {
        String value = required(ticketNo, "工单号不能为空");
        AfterSaleTicket ticket = afterSaleMapper.findByTicketNoForUpdate(value);
        if (ticket == null) throw new BusinessException("工单不存在");
        return ticket;
    }

    private static void ensureOpen(AfterSaleTicket ticket) {
        if (ticket.getStatus() == CLOSED || ticket.getStatus() == CANCELLED || ticket.getStatus() == REJECTED) {
            throw new BusinessException("工单已关闭或已拒绝");
        }
    }

    private static void validateAttachment(String url, String objectKey, String fileName, Long fileSize) {
        if (url == null || objectKey == null || url.isBlank() || objectKey.isBlank()) {
            throw new BusinessException("附件信息不完整");
        }
        if (url.length() > 1000 || objectKey.length() > 500
                || (fileName != null && fileName.length() > 255)
                || (fileSize != null && fileSize <= 0)) {
            throw new BusinessException("附件信息不合法");
        }
    }

    private static String normalizeEnum(String value, List<String> allowed, String message) {
        String normalized = required(value, message).toUpperCase();
        if (!allowed.contains(normalized)) throw new BusinessException(message);
        return normalized;
    }

    private static String required(String value, String message) {
        if (value == null || value.trim().isEmpty()) throw new BusinessException(message);
        return value.trim();
    }

    private static Bounds bounds(Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 20 : Math.min(size, 100);
        long offset = ((long) safePage - 1) * safeSize;
        if (offset > Integer.MAX_VALUE) throw new BusinessException("页码过大");
        return new Bounds(safePage, safeSize, (int) offset);
    }

    private record Bounds(int page, int size, int offset) {}
}
