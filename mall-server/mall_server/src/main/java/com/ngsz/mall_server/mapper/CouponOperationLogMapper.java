package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.CouponOperationLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CouponOperationLogMapper {
    void insert(CouponOperationLog log);
    List<Map<String, Object>> findByTemplateId(@Param("templateId") Long templateId);
    Map<String, Object> summarizeByTemplateId(@Param("templateId") Long templateId);
}
