package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserMapper {
    User findByUsername(@Param("username") String username);
    User findByPhone(@Param("phone") String phone);
    User findById(@Param("id") Long id);
    void insert(User user);
    void update(User user);
    int updateAvatar(@Param("userId") Long userId, @Param("avatarUrl") String avatarUrl);
    void updateLoginInfo(User user);
    List<User> findAll();
    List<User> findByCondition(@Param("keyword") String keyword, @Param("role") Integer role, @Param("status") Integer status);
    int countAll();
}
