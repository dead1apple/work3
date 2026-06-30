package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.mapper.CategoryMapper;
import com.ngsz.mall_server.pojo.Category;
import com.ngsz.mall_server.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {
    @Autowired private CategoryMapper categoryMapper;

    @Override
    public List<Map<String, Object>> getCategoryTree() {
        List<Category> all = categoryMapper.findAll();
        Map<Long, List<Category>> byParent = all.stream().collect(Collectors.groupingBy(Category::getParentId));
        List<Category> topLevels = byParent.getOrDefault(0L, List.of());
        return topLevels.stream().map(top -> {
            Map<String, Object> node = new HashMap<>();
            node.put("category", top);
            List<Map<String, Object>> secondNodes = byParent.getOrDefault(top.getId(), List.of()).stream().map(sec -> {
                Map<String, Object> sNode = new HashMap<>();
                sNode.put("category", sec);
                sNode.put("children", byParent.getOrDefault(sec.getId(), List.of()));
                return sNode;
            }).collect(Collectors.toList());
            node.put("children", secondNodes);
            return node;
        }).collect(Collectors.toList());
    }

    @Override public List<Category> listByParentId(Long parentId) { return categoryMapper.findByParentId(parentId); }
    @Override public void addCategory(Category category) { categoryMapper.insert(category); }
    @Override public void updateCategory(Category category) { categoryMapper.update(category); }
}
