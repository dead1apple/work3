package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Payment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PaymentMapper {
    Payment findByPaymentNo(@Param("paymentNo") String paymentNo);
    Payment findByOrderNo(@Param("orderNo") String orderNo);
    void insert(Payment payment);
    void update(Payment payment);
}
