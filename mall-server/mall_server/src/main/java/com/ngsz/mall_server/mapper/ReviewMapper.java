package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Review;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ReviewMapper {
    List<Review> findByProductId(@Param("productId") Long productId, @Param("offset") Integer offset, @Param("size") Integer size);
    int countByProductId(@Param("productId") Long productId);
    Review findByOrderItemId(@Param("orderItemId") Long orderItemId);
    void insert(Review review);
    void updateReply(@Param("id") Long id, @Param("reply") String reply);
}
