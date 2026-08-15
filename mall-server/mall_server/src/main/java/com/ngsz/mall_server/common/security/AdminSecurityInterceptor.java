package com.ngsz.mall_server.common.security;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Slf4j
@Component
public class AdminSecurityInterceptor implements HandlerInterceptor {

    private static final String ADMIN_CONTEXT_ATTRIBUTE =
            AdminSecurityInterceptor.class.getName() + ".ADMIN_CONTEXT";
    private static final String REQUEST_FAILED_ATTRIBUTE =
            AdminSecurityInterceptor.class.getName() + ".REQUEST_FAILED";
    private static final String OPERATION_LOGGED_ATTRIBUTE =
            AdminSecurityInterceptor.class.getName() + ".OPERATION_LOGGED";

    private final AdminSecurityService securityService;

    public AdminSecurityInterceptor(AdminSecurityService securityService) {
        this.securityService = securityService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!StpUtil.isLogin()) {
            throw new BusinessException("请先登录管理员账号");
        }
        AdminSecurityService.AdminContext context = securityService.loadAdminContext(
                StpUtil.getLoginIdAsLong(), request.getRequestURI());
        request.setAttribute(ADMIN_CONTEXT_ATTRIBUTE, context);
        try {
            securityService.checkPermission(context, request.getMethod());
        } catch (RuntimeException exception) {
            markRequestFailed(request);
            if (isMutation(request)) {
                recordOperation(request, context, false);
            }
            throw exception;
        }
        return true;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request, HttpServletResponse response,
            Object handler, Exception exception) {
        if (!isMutation(request)
                || Boolean.TRUE.equals(request.getAttribute(OPERATION_LOGGED_ATTRIBUTE))) {
            return;
        }
        Object attribute = request.getAttribute(ADMIN_CONTEXT_ATTRIBUTE);
        if (!(attribute instanceof AdminSecurityService.AdminContext context)) {
            return;
        }
        boolean success = exception == null
                && response.getStatus() < 400
                && !Boolean.TRUE.equals(request.getAttribute(REQUEST_FAILED_ATTRIBUTE));
        recordOperation(request, context, success);
    }

    public static void markRequestFailed(HttpServletRequest request) {
        request.setAttribute(REQUEST_FAILED_ATTRIBUTE, true);
    }

    private void recordOperation(
            HttpServletRequest request, AdminSecurityService.AdminContext context, boolean success) {
        request.setAttribute(OPERATION_LOGGED_ATTRIBUTE, true);
        try {
            securityService.recordOperation(
                    context, request.getMethod(), request.getRequestURI(), success, clientIp(request));
        } catch (Exception logException) {
            log.warn("管理员操作日志记录失败，不影响原业务响应", logException);
        }
    }

    private static boolean isMutation(HttpServletRequest request) {
        return !"GET".equalsIgnoreCase(request.getMethod());
    }

    private static String clientIp(HttpServletRequest request) {
        ParsedIp remote = parseIp(request.getRemoteAddr());
        if (remote != null && isTrustedProxy(remote.address())) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                ParsedIp forwarded = parseIp(forwardedFor.split(",", 2)[0]);
                if (forwarded != null) {
                    return forwarded.value();
                }
            }
        }
        return remote == null ? "unknown" : remote.value();
    }

    private static ParsedIp parseIp(String value) {
        if (value == null) {
            return null;
        }
        String candidate = value.trim();
        if (candidate.isEmpty() || candidate.length() > 45) {
            return null;
        }
        try {
            InetAddress address;
            if (candidate.contains(":")) {
                if (!candidate.matches("[0-9A-Fa-f:.]+")) {
                    return null;
                }
                address = InetAddress.getByName(candidate);
            } else {
                String[] parts = candidate.split("\\.", -1);
                if (parts.length != 4) {
                    return null;
                }
                byte[] bytes = new byte[4];
                for (int index = 0; index < parts.length; index++) {
                    if (!parts[index].matches("\\d{1,3}")) {
                        return null;
                    }
                    int part = Integer.parseInt(parts[index]);
                    if (part > 255) {
                        return null;
                    }
                    bytes[index] = (byte) part;
                }
                address = InetAddress.getByAddress(bytes);
            }
            String normalized = address.getHostAddress();
            if (normalized.length() > 45) {
                return null;
            }
            return new ParsedIp(address, normalized);
        } catch (UnknownHostException | NumberFormatException exception) {
            return null;
        }
    }

    private static boolean isTrustedProxy(InetAddress address) {
        return address.isLoopbackAddress() || address.isSiteLocalAddress();
    }

    private record ParsedIp(InetAddress address, String value) {
    }
}
