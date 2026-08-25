package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.ShopMapper;
import com.ngsz.mall_server.pojo.Shop;
import com.ngsz.mall_server.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ShopServiceImpl implements ShopService {
    private final ShopMapper shopMapper;

    @Autowired
    public ShopServiceImpl(ShopMapper shopMapper) {
        this.shopMapper = shopMapper;
    }

    @Override public Shop getById(Long id) { return shopMapper.findById(id); }
    @Override public Shop getByUserId(Long userId) { return shopMapper.findByUserId(userId); }

    @Override
    public void applyShop(Long userId, Shop shop) {
        if (shopMapper.findByUserId(userId) != null) throw new BusinessException("您已申请过店铺");
        shop.setUserId(userId); shop.setStatus(0);
        shopMapper.insert(shop);
    }

    @Override
    public void updateShop(Long userId, Shop shop) {
        Shop existing = shopMapper.findByUserId(userId);
        if (existing == null) throw new BusinessException("您还没有店铺");
        if (shop == null || shop.getId() == null || !existing.getId().equals(shop.getId())) {
            throw new BusinessException("无权修改该店铺");
        }
        shop.setUserId(userId);
        shop.setRating(null);
        if (existing.getStatus() != null && existing.getStatus() == 3) {
            shop.setStatus(0);
        } else {
            shop.setStatus(null);
        }
        shopMapper.update(shop);
    }

    @Override
    public PageResult<Shop> listShops(String keyword, Integer status, Integer page, Integer size) {
        List<Shop> all = shopMapper.findByCondition(keyword, status);
        int total = all.size(); int from = (page - 1) * size; int to = Math.min(from + size, total);
        return new PageResult<>((long) total, from < total ? all.subList(from, to) : List.of(), page, size);
    }

    @Override
    public void auditShop(Long shopId, Integer status) {
        Shop shop = shopMapper.findById(shopId);
        if (shop == null) throw new BusinessException("店铺不存在");
        shop.setStatus(status); shopMapper.update(shop);
    }
}
