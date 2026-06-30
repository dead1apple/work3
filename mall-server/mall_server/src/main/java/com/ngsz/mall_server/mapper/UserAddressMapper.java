package com.ngsz.mall_server.mapper;

import com.ngsz.mall_server.pojo.UserAddress;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface UserAddressMapper {
    List<UserAddress> findByUserId(@Param("userId") Long userId);
    UserAddress findById(@Param("id") Long id);
    UserAddress findDefault(@Param("userId") Long userId);
    void insert(UserAddress address);
    void update(UserAddress address);
    void deleteById(@Param("id") Long id);
    void resetDefault(@Param("userId") Long userId);
    void setDefault(@Param("id") Long id);
}
