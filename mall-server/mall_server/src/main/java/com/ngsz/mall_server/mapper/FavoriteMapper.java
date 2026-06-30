package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Favorite;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FavoriteMapper {
    List<Favorite> findByUserId(@Param("userId") Long userId);
    Favorite findByUserAndProduct(@Param("userId") Long userId, @Param("productId") Long productId);
    void insert(Favorite favorite);
    void deleteByUserAndProduct(@Param("userId") Long userId, @Param("productId") Long productId);
}
