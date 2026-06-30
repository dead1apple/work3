package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.Sku;
import com.ngsz.mall_server.pojo.dto.ProductDTO;
import java.util.List;
import java.util.Map;

public interface ProductService {
    PageResult<Map<String, Object>> listProducts(Long categoryId, Long brandId, String keyword, String sortBy, Integer status, Integer page, Integer size);
    Map<String, Object> getProductDetail(Long productId);
    void addProduct(Long shopId, ProductDTO dto);
    void updateProduct(Long shopId, ProductDTO dto);
    void updateStatus(Long productId, Integer status, Long shopId);
    List<Sku> listSkus(Long productId);
}
