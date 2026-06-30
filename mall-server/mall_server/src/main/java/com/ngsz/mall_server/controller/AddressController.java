package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.dto.AddressDTO;
import com.ngsz.mall_server.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "02. 收货地址", description = "当前登录用户的收货地址增删改查")
@RestController
@RequestMapping("/api/address")
public class AddressController {

    @Autowired private AddressService addressService;

    @Operation(summary = "查询我的收货地址列表", description = "返回当前登录用户的所有收货地址")
    @GetMapping("/list")
    public Result<?> list() {
        return Result.success(addressService.listByUserId(StpUtil.getLoginIdAsLong()));
    }

    @Operation(summary = "查询单个地址详情", description = "只能查询当前用户自己的地址")
    @GetMapping("/{id}")
    public Result<?> getById(@Parameter(description = "地址 ID", example = "1") @PathVariable Long id) {
        return Result.success(addressService.getById(id));
    }

    @Operation(summary = "新增收货地址", description = "如果 isDefault=1，则将该地址设为默认")
    @PostMapping
    public Result<?> add(@Valid @RequestBody AddressDTO dto) {
        addressService.add(StpUtil.getLoginIdAsLong(), dto);
        return Result.success("添加成功");
    }

    @Operation(summary = "修改收货地址", description = "只能修改当前用户自己的地址，需传入地址 ID")
    @PutMapping
    public Result<?> update(@Valid @RequestBody AddressDTO dto) {
        addressService.update(StpUtil.getLoginIdAsLong(), dto);
        return Result.success("修改成功");
    }

    @Operation(summary = "删除收货地址", description = "只能删除当前用户自己的地址")
    @DeleteMapping("/{id}")
    public Result<?> delete(@Parameter(description = "地址 ID", example = "1") @PathVariable Long id) {
        addressService.delete(StpUtil.getLoginIdAsLong(), id);
        return Result.success("删除成功");
    }

    @Operation(summary = "设为默认地址", description = "将该地址设为当前用户的默认收货地址")
    @PutMapping("/default/{id}")
    public Result<?> setDefault(@Parameter(description = "地址 ID", example = "1") @PathVariable Long id) {
        addressService.setDefault(StpUtil.getLoginIdAsLong(), id);
        return Result.success("设置成功");
    }
}
