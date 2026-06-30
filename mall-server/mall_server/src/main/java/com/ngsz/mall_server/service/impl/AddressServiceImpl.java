package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.mapper.UserAddressMapper;
import com.ngsz.mall_server.pojo.UserAddress;
import com.ngsz.mall_server.pojo.dto.AddressDTO;
import com.ngsz.mall_server.service.AddressService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AddressServiceImpl implements AddressService {
    @Autowired private UserAddressMapper addressMapper;

    @Override public List<UserAddress> listByUserId(Long userId) { return addressMapper.findByUserId(userId); }
    @Override public UserAddress getById(Long id) { return addressMapper.findById(id); }

    @Override @Transactional
    public void add(Long userId, AddressDTO dto) {
        UserAddress address = new UserAddress();
        BeanUtils.copyProperties(dto, address);
        address.setUserId(userId);
        if (dto.getIsDefault() != null && dto.getIsDefault() == 1) addressMapper.resetDefault(userId);
        addressMapper.insert(address);
    }

    @Override @Transactional
    public void update(Long userId, AddressDTO dto) {
        UserAddress address = addressMapper.findById(dto.getId());
        if (address == null || !address.getUserId().equals(userId)) throw new BusinessException("地址不存在");
        BeanUtils.copyProperties(dto, address);
        if (dto.getIsDefault() != null && dto.getIsDefault() == 1) addressMapper.resetDefault(userId);
        addressMapper.update(address);
    }

    @Override public void delete(Long userId, Long addressId) {
        UserAddress address = addressMapper.findById(addressId);
        if (address == null || !address.getUserId().equals(userId)) throw new BusinessException("地址不存在");
        addressMapper.deleteById(addressId);
    }

    @Override @Transactional
    public void setDefault(Long userId, Long addressId) {
        UserAddress address = addressMapper.findById(addressId);
        if (address == null || !address.getUserId().equals(userId)) throw new BusinessException("地址不存在");
        addressMapper.resetDefault(userId);
        addressMapper.setDefault(addressId);
    }
}
