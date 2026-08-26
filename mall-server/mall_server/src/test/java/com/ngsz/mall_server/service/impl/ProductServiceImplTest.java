package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.ProductMapper;
import com.ngsz.mall_server.mapper.SkuMapper;
import com.ngsz.mall_server.pojo.Product;
import com.ngsz.mall_server.pojo.Sku;
import com.ngsz.mall_server.pojo.dto.ProductDTO;
import com.ngsz.mall_server.pojo.dto.SkuDTO;
import com.ngsz.mall_server.pojo.vo.ProductDetailVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;
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

    @Test
    void addProductUsesPendingAndDatabaseSafeDefaults() {
        doAnswer(invocation -> {
            invocation.<Product>getArgument(0).setId(99L);
            return null;
        }).when(productMapper).insert(any(Product.class));
        when(skuMapper.findByProductId(99L)).thenReturn(List.of());
        ProductDTO dto = validProductDto();

        ProductDetailVO detail = new ProductServiceImpl(productMapper, skuMapper).addProduct(12L, dto);

        var productCaptor = org.mockito.ArgumentCaptor.forClass(Product.class);
        verify(productMapper).insert(productCaptor.capture());
        assertThat(productCaptor.getValue().getShopId()).isEqualTo(12L);
        assertThat(productCaptor.getValue().getStatus()).isEqualTo(2);
        assertThat(productCaptor.getValue().getSortOrder()).isZero();
        assertThat(detail.getProduct().getId()).isEqualTo(99L);

        var skuCaptor = org.mockito.ArgumentCaptor.forClass(Sku.class);
        verify(skuMapper).insert(skuCaptor.capture());
        assertThat(skuCaptor.getValue().getProductId()).isEqualTo(99L);
        assertThat(skuCaptor.getValue().getStatus()).isEqualTo(1);
        assertThat(skuCaptor.getValue().getLockedStock()).isZero();
        assertThat(skuCaptor.getValue().getDeleted()).isZero();
    }

    @Test
    void merchantDetailRejectsAnotherShopsProduct() {
        Product product = new Product();
        product.setId(20L);
        product.setShopId(5L);
        when(productMapper.findById(20L)).thenReturn(product);

        assertThatThrownBy(() -> new ProductServiceImpl(productMapper, skuMapper)
                .getMerchantProductDetail(6L, 20L))
                .isInstanceOf(com.ngsz.mall_server.common.exception.BusinessException.class)
                .hasMessage("商品不存在");
        verify(skuMapper, never()).findByProductId(anyLong());
    }

    @Test
    void updateProductSynchronizesSkusAndReturnsToPendingReview() {
        Product product = new Product();
        product.setId(30L);
        product.setShopId(12L);
        product.setStatus(1);
        Sku retained = sku(301L, 30L, "旧名称");
        Sku removed = sku(302L, 30L, "待删除");
        when(productMapper.findById(30L)).thenReturn(product);
        when(skuMapper.findByProductId(30L))
                .thenReturn(List.of(retained, removed))
                .thenReturn(List.of(retained));

        ProductDTO dto = validProductDto();
        dto.setId(30L);
        dto.getSkuList().get(0).setId(301L);
        dto.getSkuList().get(0).setSkuName("新名称");
        SkuDTO added = validSkuDto();
        added.setSkuName("新增规格");
        dto.setSkuList(List.of(dto.getSkuList().get(0), added));

        new ProductServiceImpl(productMapper, skuMapper).updateProduct(12L, dto);

        assertThat(product.getStatus()).isEqualTo(2);
        assertThat(retained.getSkuName()).isEqualTo("新名称");
        verify(productMapper).update(product);
        verify(skuMapper).update(retained);
        verify(skuMapper).softDeleteByIds(30L, List.of(302L));
        verify(skuMapper).insert(argThat(sku -> sku.getId() == null
                && sku.getProductId().equals(30L) && sku.getStatus() == 1));
    }

    @Test
    void merchantCannotBypassPendingReviewBySettingOnSaleStatus() {
        Product product = new Product();
        product.setId(40L);
        product.setShopId(12L);
        product.setStatus(2);
        when(productMapper.findById(40L)).thenReturn(product);

        assertThatThrownBy(() -> new ProductServiceImpl(productMapper, skuMapper)
                .updateStatus(40L, 1, 12L))
                .isInstanceOf(com.ngsz.mall_server.common.exception.BusinessException.class)
                .hasMessage("待审核商品不能直接上架");
        verify(productMapper, never()).update(product);
    }

    private ProductDTO validProductDto() {
        ProductDTO dto = new ProductDTO();
        dto.setCategoryId(1L);
        dto.setName("测试商品");
        dto.setSkuList(List.of(validSkuDto()));
        return dto;
    }

    private SkuDTO validSkuDto() {
        SkuDTO dto = new SkuDTO();
        dto.setSkuName("默认规格");
        dto.setPrice(new BigDecimal("10.00"));
        dto.setStock(10);
        return dto;
    }

    private Sku sku(Long id, Long productId, String name) {
        Sku sku = new Sku();
        sku.setId(id);
        sku.setProductId(productId);
        sku.setSkuName(name);
        sku.setStatus(1);
        return sku;
    }
}
