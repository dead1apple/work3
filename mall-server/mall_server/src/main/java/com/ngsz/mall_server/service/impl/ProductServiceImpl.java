package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.ProductMapper;
import com.ngsz.mall_server.mapper.SkuMapper;
import com.ngsz.mall_server.pojo.Product;
import com.ngsz.mall_server.pojo.Sku;
import com.ngsz.mall_server.pojo.dto.ProductDTO;
import com.ngsz.mall_server.service.ProductService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {
    private final ProductMapper productMapper;
    private final SkuMapper skuMapper;

    @Autowired
    public ProductServiceImpl(ProductMapper productMapper, SkuMapper skuMapper) {
        this.productMapper = productMapper;
        this.skuMapper = skuMapper;
    }

    @Override
    public PageResult<Map<String, Object>> listProducts(Long categoryId, Long brandId, String keyword,
            String sortBy, Integer status, Integer page, Integer size, Long shopId) {
        int offset = (page - 1) * size;
        List<Product> products = productMapper.findByCondition(categoryId, brandId, keyword, status, shopId, offset, size, sortBy);
        int total = productMapper.countByCondition(categoryId, brandId, keyword, status, shopId);
        List<Map<String, Object>> list = products.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("product", p);
            List<Sku> skus = skuMapper.findByProductId(p.getId());
            if (!skus.isEmpty()) {
                map.put("minPrice", skus.stream().map(Sku::getPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO));
                map.put("maxPrice", skus.stream().map(Sku::getPrice).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO));
                map.put("totalStock", skus.stream().mapToInt(Sku::getStock).sum());
            }
            return map;
        }).collect(Collectors.toList());
        return new PageResult<>((long) total, list, page, size);
    }

    @Override
    public Map<String, Object> getProductDetail(Long productId) {
        Product product = productMapper.findById(productId);
        if (product == null || product.getDeleted() == 1
                || product.getStatus() == null || product.getStatus() != 1) {
            throw new BusinessException("商品不存在或已下架");
        }
        List<Sku> skus = skuMapper.findByProductId(productId);
        Map<String, Object> result = new HashMap<>();
        result.put("product", product);
        result.put("skuList", skus);
        return result;
    }

    @Override @Transactional
    public void addProduct(Long shopId, ProductDTO dto) {
        Product product = new Product();
        BeanUtils.copyProperties(dto, product);
        product.setShopId(shopId);
        if (dto.getImages() != null) product.setImages(String.join(",", dto.getImages()));
        product.setStatus(0);
        product.setSalesCount(0);
        productMapper.insert(product);
        if (dto.getSkuList() != null) {
            for (var skuDto : dto.getSkuList()) {
                Sku sku = new Sku();
                BeanUtils.copyProperties(skuDto, sku);
                sku.setProductId(product.getId());
                sku.setLockedStock(0);
                sku.setDeleted(0);
                skuMapper.insert(sku);
            }
        }
    }

    @Override @Transactional
    public void updateProduct(Long shopId, ProductDTO dto) {
        Product product = productMapper.findById(dto.getId());
        if (product == null) throw new BusinessException("商品不存在");
        if (!product.getShopId().equals(shopId)) throw new BusinessException("无权操作");
        BeanUtils.copyProperties(dto, product, "id", "shopId", "salesCount");
        if (dto.getImages() != null) product.setImages(String.join(",", dto.getImages()));
        productMapper.update(product);
    }

    @Override
    public void updateStatus(Long productId, Integer status, Long shopId) {
        Product product = productMapper.findById(productId);
        if (product == null) throw new BusinessException("商品不存在");
        if (shopId != null && !product.getShopId().equals(shopId)) throw new BusinessException("无权操作");
        product.setStatus(status);
        productMapper.update(product);
    }

    @Override public List<Sku> listSkus(Long productId) { return skuMapper.findByProductId(productId); }
}
