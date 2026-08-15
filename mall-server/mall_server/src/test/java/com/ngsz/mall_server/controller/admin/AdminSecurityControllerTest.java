package com.ngsz.mall_server.controller.admin;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.security.AdminSecurityService;
import com.ngsz.mall_server.pojo.dto.AdminRoleRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSecurityControllerTest {

    @Mock
    private AdminSecurityService securityService;

    @InjectMocks
    private AdminSecurityController controller;

    @Test
    void mutationsPassCurrentOperatorIdToSecurityService() {
        AdminRoleRequest request = new AdminRoleRequest();
        request.setName("审核员");
        request.setCode("AUDITOR");
        request.setPermissions(List.of("products:view"));
        Map<String, Object> role = Map.of(
                "id", 7L,
                "name", "审核员",
                "code", "AUDITOR",
                "permissions", List.of("products:view"),
                "status", 1
        );
        when(securityService.createRole(42L, request)).thenReturn(role);
        when(securityService.updateRole(42L, 7L, request)).thenReturn(role);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(42L);
            controller.createRole(request);
            controller.updateRole(7L, request);
            controller.assignRole(9L, 7L);
        }

        verify(securityService).createRole(42L, request);
        verify(securityService).updateRole(42L, 7L, request);
        verify(securityService).assignRole(42L, 9L, 7L);
    }
}
