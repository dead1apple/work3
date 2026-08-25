package com.ngsz.mall_server.service;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.Shop;

public interface ShopService {
    Shop getById(Long id);
    Shop getByUserId(Long userId);
    void applyShop(Long userId, Shop shop);
    void updateShop(Long userId, Shop shop);
    PageResult<Shop> listShops(String keyword, Integer status, Integer page, Integer size);
    void auditShop(Long shopId, Integer status);
}
