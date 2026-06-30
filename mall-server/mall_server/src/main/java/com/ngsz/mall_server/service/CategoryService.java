package com.ngsz.mall_server.service;
import com.ngsz.mall_server.pojo.Category;
import java.util.List;
import java.util.Map;

public interface CategoryService {
    List<Map<String, Object>> getCategoryTree();
    List<Category> listByParentId(Long parentId);
    void addCategory(Category category);
    void updateCategory(Category category);
}
