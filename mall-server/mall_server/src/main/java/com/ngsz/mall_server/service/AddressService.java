package com.ngsz.mall_server.service;

import com.ngsz.mall_server.pojo.UserAddress;
import com.ngsz.mall_server.pojo.dto.AddressDTO;
import java.util.List;

public interface AddressService {
    List<UserAddress> listByUserId(Long userId);
    UserAddress getById(Long id);
    void add(Long userId, AddressDTO dto);
    void update(Long userId, AddressDTO dto);
    void delete(Long userId, Long addressId);
    void setDefault(Long userId, Long addressId);
}
