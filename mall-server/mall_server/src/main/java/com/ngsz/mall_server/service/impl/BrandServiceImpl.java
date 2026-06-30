package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.BrandMapper;
import com.ngsz.mall_server.pojo.Brand;
import com.ngsz.mall_server.service.BrandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BrandServiceImpl implements BrandService {
    @Autowired private BrandMapper brandMapper;
    @Override public List<Brand> listAll() { return brandMapper.findAll(); }
    @Override public Brand getById(Long id) { Brand b = brandMapper.findById(id); if (b == null) throw new BusinessException("品牌不存在"); return b; }
    @Override public void addBrand(Brand brand) { brandMapper.insert(brand); }
    @Override public void updateBrand(Brand brand) { brandMapper.update(brand); }
}
