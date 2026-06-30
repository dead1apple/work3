package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.CartMapper;
import com.ngsz.mall_server.mapper.ProductMapper;
import com.ngsz.mall_server.mapper.SkuMapper;
import com.ngsz.mall_server.pojo.Cart;
import com.ngsz.mall_server.pojo.Product;
import com.ngsz.mall_server.pojo.Sku;
import com.ngsz.mall_server.pojo.dto.CartDTO;
import com.ngsz.mall_server.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CartServiceImpl implements CartService {
    @Autowired private CartMapper cartMapper;
    @Autowired private SkuMapper skuMapper;
    @Autowired private ProductMapper productMapper;

    @Override
    public List<Map<String, Object>> listCartItems(Long userId) {
        List<Cart> carts = cartMapper.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Cart cart : carts) {
            Map<String, Object> item = new HashMap<>();
            item.put("cart", cart);
            Sku sku = skuMapper.findById(cart.getSkuId());
            item.put("sku", sku);
            if (sku != null) { Product product = productMapper.findById(sku.getProductId()); item.put("product", product); }
            result.add(item);
        }
        return result;
    }

    @Override
    public void addToCart(Long userId, CartDTO dto) {
        Cart existing = cartMapper.findByUserAndSku(userId, dto.getSkuId());
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + dto.getQuantity());
            cartMapper.updateQuantity(existing);
        } else {
            Sku sku = skuMapper.findById(dto.getSkuId());
            if (sku == null || sku.getStatus() != 1) throw new BusinessException("商品规格不存在或已下架");
            Cart cart = new Cart();
            cart.setUserId(userId); cart.setSkuId(dto.getSkuId()); cart.setProductId(sku.getProductId());
            cart.setQuantity(dto.getQuantity()); cart.setSelected(1);
            cartMapper.insert(cart);
        }
    }

    @Override public void updateQuantity(Long userId, Long cartId, Integer quantity) {
        if (quantity < 1) throw new BusinessException("数量不能小于1");
        Cart c = new Cart(); c.setId(cartId); c.setQuantity(quantity);
        cartMapper.updateQuantity(c);
    }

    @Override public void updateSelected(Long userId, Long cartId, Integer selected) {
        Cart c = new Cart(); c.setId(cartId); c.setSelected(selected);
        cartMapper.updateSelected(c);
    }

    @Override public void selectAll(Long userId, Integer selected) { cartMapper.selectAll(userId, selected); }
    @Override public void removeFromCart(Long userId, Long cartId) { cartMapper.deleteById(cartId); }
}
