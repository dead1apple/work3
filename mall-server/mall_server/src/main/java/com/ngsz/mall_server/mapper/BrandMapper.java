package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Brand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface BrandMapper {
    List<Brand> findAll();
    List<Brand> findAllForAdmin();
    Brand findById(@Param("id") Long id);
    void insert(Brand brand);
    void update(Brand brand);
}
