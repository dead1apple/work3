package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.ShopMapper;
import com.ngsz.mall_server.mapper.UserMapper;
import com.ngsz.mall_server.pojo.Shop;
import com.ngsz.mall_server.pojo.User;
import org.springframework.stereotype.Service;

@Service
public class MerchantAccessService {
    private final UserMapper userMapper;
    private final ShopMapper shopMapper;

    public MerchantAccessService(UserMapper userMapper, ShopMapper shopMapper) {
        this.userMapper = userMapper;
        this.shopMapper = shopMapper;
    }

    public Long requireActiveShop(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException("账号不可用");
        }
        if (user.getRole() == null || user.getRole() != 1) {
            throw new BusinessException("仅商家账号可访问");
        }
        Shop shop = shopMapper.findByUserId(userId);
        if (shop == null) {
            throw new BusinessException("您还没有店铺");
        }
        if (shop.getStatus() == null || shop.getStatus() != 1) {
            throw new BusinessException("店铺尚未通过审核或已被停用");
        }
        return shop.getId();
    }
}
