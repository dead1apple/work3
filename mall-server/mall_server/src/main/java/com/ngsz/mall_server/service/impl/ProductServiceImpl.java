package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.ProductMapper;
import com.ngsz.mall_server.mapper.SkuMapper;
import com.ngsz.mall_server.pojo.Product;
import com.ngsz.mall_server.pojo.Sku;
import com.ngsz.mall_server.pojo.dto.ProductDTO;
import com.ngsz.mall_server.pojo.dto.SkuDTO;
import com.ngsz.mall_server.pojo.vo.ProductDetailVO;
import com.ngsz.mall_server.pojo.vo.ProductListItemVO;
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
    public PageResult<ProductListItemVO> listProducts(Long categoryId, Long brandId, String keyword,
            String sortBy, Integer status, Integer page, Integer size, Long shopId) {
        int offset = (page - 1) * size;
        List<Product> products = productMapper.findByCondition(categoryId, brandId, keyword, status, shopId, offset, size, sortBy);
        int total = productMapper.countByCondition(categoryId, brandId, keyword, status, shopId);
        List<ProductListItemVO> list = products.stream().map(p -> {
            List<Sku> skus = skuMapper.findByProductId(p.getId());
            BigDecimal minPrice = skus.stream().map(Sku::getPrice).filter(Objects::nonNull)
                    .min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            BigDecimal maxPrice = skus.stream().map(Sku::getPrice).filter(Objects::nonNull)
                    .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            int totalStock = skus.stream().map(Sku::getStock).filter(Objects::nonNull).mapToInt(Integer::intValue).sum();
            return new ProductListItemVO(p, minPrice, maxPrice, totalStock);
        }).collect(Collectors.toList());
        return new PageResult<>((long) total, list, page, size);
    }

    @Override
    public ProductDetailVO getProductDetail(Long productId) {
        Product product = productMapper.findById(productId);
        if (product == null || Objects.equals(product.getDeleted(), 1)
                || product.getStatus() == null || product.getStatus() != 1) {
            throw new BusinessException("商品不存在或已下架");
        }
        return buildDetail(product);
    }

    @Override @Transactional
    public ProductDetailVO addProduct(Long shopId, ProductDTO dto) {
        Product product = new Product();
        BeanUtils.copyProperties(dto, product);
        product.setShopId(shopId);
        if (dto.getImages() != null) product.setImages(String.join(",", dto.getImages()));
        product.setStatus(2);
        product.setSalesCount(0);
        product.setSortOrder(0);
        productMapper.insert(product);
        for (SkuDTO skuDto : dto.getSkuList()) {
            Sku sku = toNewSku(product.getId(), skuDto);
            skuMapper.insert(sku);
        }
        return buildDetail(product);
    }

    @Override @Transactional
    public ProductDetailVO updateProduct(Long shopId, ProductDTO dto) {
        if (dto.getId() == null) throw new BusinessException("商品 ID 不能为空");
        Product product = productMapper.findById(dto.getId());
        if (product == null) throw new BusinessException("商品不存在");
        if (!Objects.equals(product.getShopId(), shopId)) throw new BusinessException("无权操作");
        BeanUtils.copyProperties(dto, product, "id", "shopId", "salesCount", "sortOrder", "status");
        if (dto.getImages() != null) product.setImages(String.join(",", dto.getImages()));
        product.setStatus(2);
        productMapper.update(product);
        syncSkus(product.getId(), dto.getSkuList());
        return buildDetail(product);
    }

    @Override
    public ProductDetailVO getMerchantProductDetail(Long shopId, Long productId) {
        Product product = productMapper.findById(productId);
        if (product == null || !Objects.equals(product.getShopId(), shopId)) {
            throw new BusinessException("商品不存在");
        }
        return buildDetail(product);
    }

    @Override
    public void updateStatus(Long productId, Integer status, Long shopId) {
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException("商品状态只能是 0 或 1");
        }
        Product product = productMapper.findById(productId);
        if (product == null) throw new BusinessException("商品不存在");
        if (shopId != null && !Objects.equals(product.getShopId(), shopId)) throw new BusinessException("无权操作");
        if (shopId != null && Objects.equals(product.getStatus(), 2) && status == 1) {
            throw new BusinessException("待审核商品不能直接上架");
        }
        product.setStatus(status);
        productMapper.update(product);
    }

    @Override public List<Sku> listSkus(Long productId) { return skuMapper.findByProductId(productId); }

    private ProductDetailVO buildDetail(Product product) {
        return new ProductDetailVO(product, skuMapper.findByProductId(product.getId()));
    }

    private Sku toNewSku(Long productId, SkuDTO dto) {
        Sku sku = new Sku();
        BeanUtils.copyProperties(dto, sku, "id");
        sku.setProductId(productId);
        sku.setLockedStock(0);
        sku.setDeleted(0);
        if (sku.getStatus() == null) sku.setStatus(1);
        return sku;
    }

    private void syncSkus(Long productId, List<SkuDTO> skuDtos) {
        Map<Long, Sku> existing = skuMapper.findByProductId(productId).stream()
                .collect(Collectors.toMap(Sku::getId, sku -> sku));
        for (SkuDTO skuDto : skuDtos) {
            if (skuDto.getId() == null) {
                skuMapper.insert(toNewSku(productId, skuDto));
                continue;
            }
            Sku sku = existing.remove(skuDto.getId());
            if (sku == null) throw new BusinessException("SKU 不存在或不属于该商品");
            if (sku.getLockedStock() != null && skuDto.getStock() < sku.getLockedStock()) {
                throw new BusinessException("SKU 库存不能小于已锁定库存");
            }
            BeanUtils.copyProperties(skuDto, sku, "id");
            if (sku.getStatus() == null) sku.setStatus(1);
            skuMapper.update(sku);
        }
        if (!existing.isEmpty()) {
            skuMapper.softDeleteByIds(productId, new ArrayList<>(existing.keySet()));
        }
    }
}
