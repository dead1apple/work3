package com.ngsz.mall_server.common.security;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSecurityInterceptorTest {

    @Mock
    private AdminSecurityService securityService;

    @Test
    void rejectsRequestWithoutSaTokenLogin() {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(false);

            assertThatThrownBy(() -> interceptor.preHandle(
                    request, new MockHttpServletResponse(), new Object()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("请先登录管理员账号");
        }

        verifyNoInteractions(securityService);
    }

    @Test
    void allowsCorsPreflightWithoutLogin() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/admin/users");

        assertThat(interceptor.preHandle(
                request, new MockHttpServletResponse(), new Object())).isTrue();

        verifyNoInteractions(securityService);
    }

    @Test
    void delegatesLoggedInRequestToPermissionService() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(8L, "admin-8", "users");
        when(securityService.loadAdminContext(8L, "/api/admin/users")).thenReturn(context);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(8L);

            assertThat(interceptor.preHandle(
                    request, new MockHttpServletResponse(), new Object())).isTrue();
        }

        verify(securityService).loadAdminContext(8L, "/api/admin/users");
        verify(securityService).checkPermission(context, "GET");
    }

    @Test
    void recordsNonGetRequestAfterCompletion() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/admin/users/9/status");
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "198.51.100.4, 10.0.0.2");
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(8L, "admin-8", "users");
        when(securityService.loadAdminContext(8L, "/api/admin/users/9/status")).thenReturn(context);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(8L);
            interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
        }

        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        verify(securityService).recordOperation(
                context, "PUT", "/api/admin/users/9/status", true, "198.51.100.4");
    }

    @Test
    void ignoresForwardedForFromPublicRemoteAddress() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/admin/users/9/status");
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("X-Forwarded-For", "10.0.0.9");
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(8L, "admin-8", "users");
        when(securityService.loadAdminContext(8L, "/api/admin/users/9/status")).thenReturn(context);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(8L);
            interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
        }
        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        verify(securityService).recordOperation(
                context, "PUT", "/api/admin/users/9/status", true, "203.0.113.10");
    }

    @Test
    void ignoresOverlongForwardedForFromTrustedProxy() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/security/roles");
        request.setRemoteAddr("192.168.1.8");
        request.addHeader("X-Forwarded-For", "1".repeat(100));
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(8L, "admin-8", "security");
        when(securityService.loadAdminContext(8L, "/api/admin/security/roles")).thenReturn(context);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(8L);
            interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
        }
        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        verify(securityService).recordOperation(
                context, "POST", "/api/admin/security/roles", true, "192.168.1.8");
    }

    @Test
    void invalidRemoteAddressFallsBackToBoundedUnknownValue() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/admin/coupons/1");
        request.setRemoteAddr("not-an-ip-" + "x".repeat(100));
        request.addHeader("X-Forwarded-For", "198.51.100.4");
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(8L, "admin-8", "coupons");
        when(securityService.loadAdminContext(8L, "/api/admin/coupons/1")).thenReturn(context);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(8L);
            interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
        }
        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        verify(securityService).recordOperation(
                context, "DELETE", "/api/admin/coupons/1", true, "unknown");
    }

    @Test
    void recordsDeniedAdminMutationOnceAsFailed() {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/admin/products/9/audit");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(12L, "limited-admin", "products");
        when(securityService.loadAdminContext(12L, "/api/admin/products/9/audit")).thenReturn(context);
        doThrow(new BusinessException("缺少权限: products:manage"))
                .when(securityService).checkPermission(context, "PUT");

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(12L);

            assertThatThrownBy(() -> interceptor.preHandle(request, response, new Object()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("缺少权限: products:manage");
        }

        interceptor.afterCompletion(request, response, new Object(), null);

        verify(securityService, times(1)).recordOperation(
                context, "PUT", "/api/admin/products/9/audit", false, "127.0.0.1");
    }

    @Test
    void doesNotRecordMutationForNonAdminUser() {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/admin/users/9/status");
        when(securityService.loadAdminContext(22L, "/api/admin/users/9/status"))
                .thenThrow(new BusinessException("非管理员账号无权访问后台"));

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(22L);

            assertThatThrownBy(() -> interceptor.preHandle(
                    request, new MockHttpServletResponse(), new Object()))
                    .isInstanceOf(BusinessException.class);
        }

        verify(securityService, never()).recordOperation(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyBoolean(),
                org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void handledBusinessFailureMarksMutationLogAsFailed() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/admin/orders/9/close");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(8L, "admin-8", "orders");
        when(securityService.loadAdminContext(8L, "/api/admin/orders/9/close")).thenReturn(context);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(8L);
            interceptor.preHandle(request, response, new Object());
        }

        exceptionHandler.handleBusinessException(new BusinessException("订单状态不允许关闭"), request);
        interceptor.afterCompletion(request, response, new Object(), null);

        verify(securityService).recordOperation(
                context, "PUT", "/api/admin/orders/9/close", false, "127.0.0.1");
    }

    @Test
    void handledValidationFailureMarksMutationLogAsFailed() throws Exception {
        AdminSecurityInterceptor interceptor = new AdminSecurityInterceptor(securityService);
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/security/roles");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(8L, "admin-8", "security");
        when(securityService.loadAdminContext(8L, "/api/admin/security/roles")).thenReturn(context);

        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::isLogin).thenReturn(true);
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(8L);
            interceptor.preHandle(request, response, new Object());
        }

        MethodArgumentNotValidException validationException = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(validationException.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of());
        exceptionHandler.handleValidException(validationException, request);
        interceptor.afterCompletion(request, response, new Object(), null);

        verify(securityService).recordOperation(
                context, "POST", "/api/admin/security/roles", false, "127.0.0.1");
    }
}
