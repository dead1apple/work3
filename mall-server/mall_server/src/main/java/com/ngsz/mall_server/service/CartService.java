package com.ngsz.mall_server.service;
import com.ngsz.mall_server.pojo.dto.CartDTO;
import java.util.List;
import java.util.Map;

public interface CartService {
    List<Map<String, Object>> listCartItems(Long userId);
    void addToCart(Long userId, CartDTO dto);
    void updateQuantity(Long userId, Long cartId, Integer quantity);
    void updateSelected(Long userId, Long cartId, Integer selected);
    void selectAll(Long userId, Integer selected);
    void removeFromCart(Long userId, Long cartId);
}
