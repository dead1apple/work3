package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.mapper.FavoriteMapper;
import com.ngsz.mall_server.pojo.Favorite;
import com.ngsz.mall_server.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FavoriteServiceImpl implements FavoriteService {
    @Autowired private FavoriteMapper favoriteMapper;
    @Override public List<Favorite> listByUserId(Long userId) { return favoriteMapper.findByUserId(userId); }
    @Override public void addFavorite(Long userId, Long productId) {
        if (favoriteMapper.findByUserAndProduct(userId, productId) == null) {
            Favorite f = new Favorite(); f.setUserId(userId); f.setProductId(productId);
            favoriteMapper.insert(f);
        }
    }
    @Override public void removeFavorite(Long userId, Long productId) { favoriteMapper.deleteByUserAndProduct(userId, productId); }
    @Override public boolean isFavorite(Long userId, Long productId) { return favoriteMapper.findByUserAndProduct(userId, productId) != null; }
}
