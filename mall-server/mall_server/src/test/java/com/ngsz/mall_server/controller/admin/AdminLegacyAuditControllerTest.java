package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.service.AdminPlatformService;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;

class AdminLegacyAuditControllerTest {

    @Test
    void legacyProductAuditKeepsTwoArgumentSignatureAndWritesAuditRecord() {
        AdminPlatformService service = mock(AdminPlatformService.class);
        AdminProductController controller = new AdminProductController();
        ReflectionTestUtils.setField(controller, "adminPlatformService", service);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(42L);
            controller.audit(8L, 0);
        }

        verify(service).updateProductStatus(42L, 8L, 0);
    }

    @Test
    void legacyShopAuditKeepsTwoArgumentSignatureAndWritesAuditRecord() {
        AdminPlatformService service = mock(AdminPlatformService.class);
        AdminShopController controller = new AdminShopController();
        ReflectionTestUtils.setField(controller, "adminPlatformService", service);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(42L);
            controller.audit(9L, 3);
        }

        verify(service).updateShopStatus(42L, 9L, 3);
    }
}
