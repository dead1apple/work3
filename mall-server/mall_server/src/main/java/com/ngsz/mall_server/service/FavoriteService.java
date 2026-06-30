package com.ngsz.mall_server.service;
import com.ngsz.mall_server.pojo.Favorite;
import java.util.List;

public interface FavoriteService {
    List<Favorite> listByUserId(Long userId);
    void addFavorite(Long userId, Long productId);
    void removeFavorite(Long userId, Long productId);
    boolean isFavorite(Long userId, Long productId);
}
