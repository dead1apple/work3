package com.ngsz.mall_server.service;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.dto.ReviewDTO;
import java.util.Map;

public interface ReviewService {
    void addReview(Long userId, ReviewDTO dto);
    PageResult<Map<String, Object>> listByProduct(Long productId, Integer page, Integer size);
    void replyReview(Long reviewId, String reply);
}
