package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.pojo.dto.AdminBrandRequest;
import com.ngsz.mall_server.pojo.dto.AdminCategoryRequest;
import com.ngsz.mall_server.pojo.dto.AdminCouponRequest;
import com.ngsz.mall_server.pojo.dto.SystemConfigRequest;
import com.ngsz.mall_server.service.AdminContentService;
import com.ngsz.mall_server.service.CouponService;
import com.ngsz.mall_server.service.SystemConfigService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AdminContentControllerTest {

    @Mock private AdminContentService contentService;
    @Mock private CouponService couponService;
    @Mock private SystemConfigService systemConfigService;
    @InjectMocks private AdminCouponController couponController;
    @InjectMocks private AdminCatalogController catalogController;
    @InjectMocks private AdminConfigController configController;

    @Test
    void couponControllerDelegatesCrudOperations() {
        AdminCouponRequest request = new AdminCouponRequest();

        couponController.list("新人", 1, 2, 20);
        couponController.create(request);
        couponController.update(3L, request);
        couponController.updateStatus(3L, 0);

        verify(contentService).listCoupons("新人", 1, 2, 20);
        verify(contentService).createCoupon(request);
        verify(contentService).updateCoupon(3L, request);
        verify(contentService).updateCouponStatus(3L, 0);
    }

    @Test
    void catalogControllerDelegatesCategoryAndBrandOperations() {
        AdminCategoryRequest category = new AdminCategoryRequest();
        AdminBrandRequest brand = new AdminBrandRequest();

        catalogController.categories();
        catalogController.createCategory(category);
        catalogController.updateCategory(2L, category);
        catalogController.updateCategoryStatus(2L, 0);
        catalogController.brands();
        catalogController.createBrand(brand);
        catalogController.updateBrand(4L, brand);
        catalogController.updateBrandStatus(4L, 1);

        verify(contentService).listCategories();
        verify(contentService).createCategory(category);
        verify(contentService).updateCategory(2L, category);
        verify(contentService).updateCategoryStatus(2L, 0);
        verify(contentService).listBrands();
        verify(contentService).createBrand(brand);
        verify(contentService).updateBrand(4L, brand);
        verify(contentService).updateBrandStatus(4L, 1);
    }

    @Test
    void configControllerDelegatesReadAndUpdate() {
        SystemConfigRequest request = new SystemConfigRequest();

        configController.get();
        configController.update(request);

        verify(systemConfigService).getConfig();
        verify(systemConfigService).updateConfig(request);
    }
}
