package com.ngsz.mall_server.service;
import com.ngsz.mall_server.pojo.Brand;
import java.util.List;

public interface BrandService {
    List<Brand> listAll();
    Brand getById(Long id);
    void addBrand(Brand brand);
    void updateBrand(Brand brand);
}
