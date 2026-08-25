package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.ShopMapper;
import com.ngsz.mall_server.mapper.UserMapper;
import com.ngsz.mall_server.pojo.Shop;
import com.ngsz.mall_server.pojo.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MerchantAccessServiceTest {

    @Mock private UserMapper userMapper;
    @Mock private ShopMapper shopMapper;

    @Test
    void activeMerchantMustOwnAnOpenShop() {
        User user = new User();
        user.setId(7L);
        user.setRole(1);
        user.setStatus(1);
        Shop shop = new Shop();
        shop.setId(9L);
        shop.setUserId(7L);
        shop.setStatus(1);
        when(userMapper.findById(7L)).thenReturn(user);
        when(shopMapper.findByUserId(7L)).thenReturn(shop);

        assertThat(new MerchantAccessService(userMapper, shopMapper).requireActiveShop(7L))
                .isEqualTo(9L);
    }

    @Test
    void ordinaryUserCannotAccessMerchantShop() {
        User user = new User();
        user.setId(7L);
        user.setRole(0);
        user.setStatus(1);
        when(userMapper.findById(7L)).thenReturn(user);

        assertThatThrownBy(() -> new MerchantAccessService(userMapper, shopMapper)
                .requireActiveShop(7L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("仅商家账号可访问");
    }
}
