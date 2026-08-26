package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.Sku;
import com.ngsz.mall_server.pojo.dto.ProductDTO;
import com.ngsz.mall_server.pojo.vo.ProductDetailVO;
import com.ngsz.mall_server.pojo.vo.ProductListItemVO;
import java.util.List;

public interface ProductService {
    default PageResult<ProductListItemVO> listProducts(Long categoryId, Long brandId, String keyword,
            String sortBy, Integer status, Integer page, Integer size) {
        return listProducts(categoryId, brandId, keyword, sortBy, status, page, size, null);
    }
    PageResult<ProductListItemVO> listProducts(Long categoryId, Long brandId, String keyword,
            String sortBy, Integer status, Integer page, Integer size, Long shopId);
    ProductDetailVO getProductDetail(Long productId);
    ProductDetailVO getMerchantProductDetail(Long shopId, Long productId);
    ProductDetailVO addProduct(Long shopId, ProductDTO dto);
    ProductDetailVO updateProduct(Long shopId, ProductDTO dto);
    void updateStatus(Long productId, Integer status, Long shopId);
    List<Sku> listSkus(Long productId);
}
