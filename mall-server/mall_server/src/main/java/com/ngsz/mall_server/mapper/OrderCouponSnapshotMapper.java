package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.OrderCouponSnapshot;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderCouponSnapshotMapper {
    void insert(OrderCouponSnapshot snapshot);
}
