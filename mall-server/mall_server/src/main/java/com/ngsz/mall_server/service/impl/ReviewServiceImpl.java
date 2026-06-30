package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.OrderItemMapper;
import com.ngsz.mall_server.mapper.ReviewMapper;
import com.ngsz.mall_server.mapper.UserMapper;
import com.ngsz.mall_server.pojo.OrderItem;
import com.ngsz.mall_server.pojo.Review;
import com.ngsz.mall_server.pojo.User;
import com.ngsz.mall_server.pojo.dto.ReviewDTO;
import com.ngsz.mall_server.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class ReviewServiceImpl implements ReviewService {
    @Autowired private ReviewMapper reviewMapper;
    @Autowired private OrderItemMapper orderItemMapper;
    @Autowired private UserMapper userMapper;

    @Override
    public void addReview(Long userId, ReviewDTO dto) {
        if (reviewMapper.findByOrderItemId(dto.getOrderItemId()) != null) throw new BusinessException("该商品已评价");
        OrderItem item = orderItemMapper.findById(dto.getOrderItemId());
        if (item == null) throw new BusinessException("订单明细不存在");
        Review review = new Review();
        review.setUserId(userId); review.setOrderItemId(dto.getOrderItemId());
        review.setProductId(item.getProductId()); review.setSkuId(item.getSkuId());
        review.setRating(dto.getRating()); review.setContent(dto.getContent());
        review.setImages(dto.getImages()); review.setIsAnonymous(dto.getIsAnonymous() != null ? dto.getIsAnonymous() : 0);
        reviewMapper.insert(review);
    }

    @Override
    public PageResult<Map<String, Object>> listByProduct(Long productId, Integer page, Integer size) {
        int offset = (page - 1) * size;
        List<Review> reviews = reviewMapper.findByProductId(productId, offset, size);
        int total = reviewMapper.countByProductId(productId);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Review r : reviews) {
            Map<String, Object> map = new HashMap<>(); map.put("review", r);
            if (r.getIsAnonymous() == 0) {
                User u = userMapper.findById(r.getUserId());
                if (u != null) { Map<String, Object> ui = new HashMap<>(); ui.put("nickname", u.getNickname()); ui.put("avatar", u.getAvatar()); map.put("user", ui); }
            }
            list.add(map);
        }
        return new PageResult<>((long) total, list, page, size);
    }

    @Override public void replyReview(Long reviewId, String reply) { reviewMapper.updateReply(reviewId, reply); }
}
