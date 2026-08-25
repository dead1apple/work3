package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.ShopMapper;
import com.ngsz.mall_server.pojo.Shop;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShopServiceImplTest {

    @Mock private ShopMapper shopMapper;

    @Test
    void rejectedShopUpdateResetsStatusToPendingAndUsesOwnerLookup() {
        Shop existing = new Shop();
        existing.setId(9L);
        existing.setUserId(7L);
        existing.setStatus(3);
        when(shopMapper.findByUserId(7L)).thenReturn(existing);

        Shop update = new Shop();
        update.setId(9L);
        update.setShopName("新名称");
        update.setRating(java.math.BigDecimal.ZERO);
        new ShopServiceImpl(shopMapper).updateShop(7L, update);

        org.mockito.ArgumentCaptor<Shop> captor = org.mockito.ArgumentCaptor.forClass(Shop.class);
        verify(shopMapper).update(captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getStatus()).isEqualTo(0);
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getUserId()).isEqualTo(7L);
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getRating()).isNull();
    }

    @Test
    void updateCannotTargetAnotherUsersShop() {
        when(shopMapper.findByUserId(7L)).thenReturn(null);
        assertThatThrownBy(() -> new ShopServiceImpl(shopMapper).updateShop(7L, new Shop()))
                .isInstanceOf(BusinessException.class)
                .hasMessage("您还没有店铺");
    }
}
