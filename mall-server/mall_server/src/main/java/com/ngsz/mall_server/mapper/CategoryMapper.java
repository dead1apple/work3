package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.Category;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CategoryMapper {
    List<Category> findByParentId(@Param("parentId") Long parentId);
    List<Category> findAll();
    List<Category> findAllForAdmin();
    Category findById(@Param("id") Long id);
    void insert(Category category);
    void update(Category category);
}
