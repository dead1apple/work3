package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.ProductMapper;
import com.ngsz.mall_server.mapper.SkuMapper;
import com.ngsz.mall_server.pojo.Product;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock private ProductMapper productMapper;
    @Mock private SkuMapper skuMapper;

    @Test
    void listProductsPassesShopFilterToBothQueries() {
        when(productMapper.findByCondition(any(), any(), any(), any(), eq(12L), anyInt(), anyInt(), any()))
                .thenReturn(List.of());
        when(productMapper.countByCondition(any(), any(), any(), any(), eq(12L))).thenReturn(0);

        ProductServiceImpl service = new ProductServiceImpl(productMapper, skuMapper);
        service.listProducts(null, null, null, "default", 1, 1, 10, 12L);

        verify(productMapper).findByCondition(null, null, null, 1, 12L, 0, 10, "default");
        verify(productMapper).countByCondition(null, null, null, 1, 12L);
    }

    @Test
    void publicDetailRejectsProductThatIsNotOnSale() {
        Product product = new Product();
        product.setId(15L);
        product.setStatus(2);
        product.setDeleted(0);
        when(productMapper.findById(15L)).thenReturn(product);

        assertThatThrownBy(() -> new ProductServiceImpl(productMapper, skuMapper)
                .getProductDetail(15L))
                .isInstanceOf(com.ngsz.mall_server.common.exception.BusinessException.class)
                .hasMessage("商品不存在或已下架");
    }

    @Test
    void publicDetailTreatsMissingStatusAsUnavailable() {
        Product product = new Product();
        product.setId(16L);
        product.setDeleted(0);
        when(productMapper.findById(16L)).thenReturn(product);

        assertThatThrownBy(() -> new ProductServiceImpl(productMapper, skuMapper)
                .getProductDetail(16L))
                .isInstanceOf(com.ngsz.mall_server.common.exception.BusinessException.class)
                .hasMessage("商品不存在或已下架");
    }
}
