package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.mapper.BrandMapper;
import com.ngsz.mall_server.mapper.CategoryMapper;
import com.ngsz.mall_server.mapper.CouponTemplateMapper;
import com.ngsz.mall_server.pojo.Brand;
import com.ngsz.mall_server.pojo.Category;
import com.ngsz.mall_server.pojo.CouponTemplate;
import com.ngsz.mall_server.pojo.dto.AdminBrandRequest;
import com.ngsz.mall_server.pojo.dto.AdminCategoryRequest;
import com.ngsz.mall_server.pojo.dto.AdminCouponRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminContentServiceTest {

    @Mock private CouponTemplateMapper couponTemplateMapper;
    @Mock private CategoryMapper categoryMapper;
    @Mock private BrandMapper brandMapper;

    @InjectMocks private AdminContentService service;

    @Test
    void paginatesFilteredCouponsForAdmin() {
        CouponTemplate first = coupon(1L, "新人券", 1);
        CouponTemplate second = coupon(2L, "夏日券", 0);
        CouponTemplate third = coupon(3L, "会员券", 1);
        when(couponTemplateMapper.findByCondition("券", null))
                .thenReturn(List.of(first, second, third));

        PageResult<CouponTemplate> result = service.listCoupons("券", null, 2, 2);

        assertThat(result.getTotal()).isEqualTo(3);
        assertThat(result.getList()).containsExactly(third);
        assertThat(result.getPage()).isEqualTo(2);
        assertThat(result.getSize()).isEqualTo(2);
    }

    @Test
    void rejectsCouponWhoseEndTimeIsNotAfterStartTime() {
        AdminCouponRequest request = couponRequest();
        request.setEndTime(request.getStartTime());

        assertThatThrownBy(() -> service.createCoupon(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("优惠券结束时间必须晚于开始时间");
    }

    @Test
    void createsCouponWithZeroUsageCounters() {
        AdminCouponRequest request = couponRequest();

        CouponTemplate created = service.createCoupon(request);

        assertThat(created.getName()).isEqualTo("满100减20");
        assertThat(created.getIssuedCount()).isZero();
        assertThat(created.getUsedCount()).isZero();
        verify(couponTemplateMapper).insert(created);
    }

    @Test
    void updatesCouponStatusOnlyWhenCouponExists() {
        CouponTemplate existing = coupon(8L, "测试券", 1);
        when(couponTemplateMapper.findById(8L)).thenReturn(existing);

        service.updateCouponStatus(8L, 0);

        assertThat(existing.getStatus()).isZero();
        verify(couponTemplateMapper).update(existing);
        assertThatThrownBy(() -> service.updateCouponStatus(9L, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("优惠券不存在");
    }

    @Test
    void listsDisabledCategoriesAndBrandsForAdmin() {
        Category category = new Category();
        category.setId(2L);
        category.setStatus(0);
        Brand brand = new Brand();
        brand.setId(3L);
        brand.setStatus(0);
        when(categoryMapper.findAllForAdmin()).thenReturn(List.of(category));
        when(brandMapper.findAllForAdmin()).thenReturn(List.of(brand));

        assertThat(service.listCategories()).containsExactly(category);
        assertThat(service.listBrands()).containsExactly(brand);
    }

    @Test
    void createsCategoryAndBrandUsingAdminForms() {
        AdminCategoryRequest categoryRequest = new AdminCategoryRequest();
        categoryRequest.setParentId(0L);
        categoryRequest.setName("数码配件");
        categoryRequest.setLevel(1);
        categoryRequest.setSortOrder(20);
        categoryRequest.setStatus(1);
        AdminBrandRequest brandRequest = new AdminBrandRequest();
        brandRequest.setName("测试品牌");
        brandRequest.setDescription("前端联调用品牌");
        brandRequest.setSortOrder(20);
        brandRequest.setStatus(1);

        Category category = service.createCategory(categoryRequest);
        Brand brand = service.createBrand(brandRequest);

        assertThat(category.getName()).isEqualTo("数码配件");
        assertThat(brand.getName()).isEqualTo("测试品牌");
        verify(categoryMapper).insert(category);
        verify(brandMapper).insert(brand);
    }

    private static CouponTemplate coupon(Long id, String name, int status) {
        CouponTemplate coupon = new CouponTemplate();
        coupon.setId(id);
        coupon.setName(name);
        coupon.setStatus(status);
        return coupon;
    }

    private static AdminCouponRequest couponRequest() {
        AdminCouponRequest request = new AdminCouponRequest();
        request.setName("满100减20");
        request.setType(1);
        request.setAmount(new BigDecimal("20.00"));
        request.setMinAmount(new BigDecimal("100.00"));
        request.setTotalCount(100);
        request.setStartTime(LocalDateTime.of(2026, 8, 1, 0, 0));
        request.setEndTime(LocalDateTime.of(2026, 9, 1, 0, 0));
        request.setStatus(1);
        return request;
    }
}
