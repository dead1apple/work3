package com.ngsz.mall_server.service;
import java.util.Map;

public interface PayService {
    Map<String, Object> createPayment(String orderNo, Integer payType, Long userId);
    void confirmPayment(String paymentNo, Long userId);
    Map<String, Object> getPaymentStatus(String orderNo);
}
