package com.ngsz.mall_server.common.security;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.pojo.dto.AdminRoleRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSecurityServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void rejectsExistingNonAdminUser() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString(), eq(10L)))
                .thenReturn(List.of(user(10L, "buyer", 0, 1)));

        assertThatThrownBy(() -> service.authorize(10L, "GET", "/api/admin/users"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("非管理员账号无权访问后台");
    }

    @Test
    void superAdminCanAccessEveryMappedModuleAndMethod() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString(), eq(1L)))
                .thenReturn(
                        List.of(user(1L, "admin", 2, 1)),
                        List.of(role("SUPER_ADMIN", "")),
                        List.of(user(1L, "admin", 2, 1)),
                        List.of(role("SUPER_ADMIN", ""))
                );

        AdminSecurityService.AdminContext readContext =
                service.authorize(1L, "GET", "/api/admin/dashboard/summary");
        AdminSecurityService.AdminContext writeContext =
                service.authorize(1L, "DELETE", "/api/admin/config/recommendations");

        assertThat(readContext.module()).isEqualTo("dashboard");
        assertThat(writeContext.module()).isEqualTo("config");
    }

    @Test
    void customRoleViewPermissionAllowsGetButRejectsWrite() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString(), eq(2L)))
                .thenReturn(
                        List.of(user(2L, "auditor", 2, 1)),
                        List.of(role("AUDITOR", "products:view, orders:view")),
                        List.of(user(2L, "auditor", 2, 1)),
                        List.of(role("AUDITOR", "products:view, orders:view"))
                );

        AdminSecurityService.AdminContext context =
                service.authorize(2L, "GET", "/api/admin/products/9");

        assertThat(context.module()).isEqualTo("products");
        assertThatThrownBy(() -> service.authorize(2L, "POST", "/api/admin/products/9/audit"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("缺少权限: products:manage");
    }

    @Test
    void customRoleManagePermissionAllowsWrite() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString(), eq(3L)))
                .thenReturn(
                        List.of(user(3L, "operator", 2, 1)),
                        List.of(role("PRODUCT_OPERATOR", "products:manage"))
                );

        AdminSecurityService.AdminContext context =
                service.authorize(3L, "PUT", "/api/admin/products/9/audit");

        assertThat(context.username()).isEqualTo("operator");
        assertThat(context.module()).isEqualTo("products");
    }

    @Test
    void derivesExplainableRiskItemsFromRecentSecurityData() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString())).thenReturn(
                List.of(row(
                        "username", "locked-target",
                        "failureCount", 7L,
                        "lastFailureTime", "2026-08-14 12:00:00"
                )),
                List.of(row(
                        "userId", 22L,
                        "username", "disabled-admin",
                        "role", 2,
                        "disabledSince", "2026-08-13 10:00:00"
                )),
                List.of(row(
                        "ip", "203.0.113.8",
                        "failureCount", 12L,
                        "accountCount", 4L,
                        "lastFailureTime", "2026-08-14 12:30:00"
                ))
        );

        List<Map<String, Object>> risks = service.listRisks();

        assertThat(risks).extracting(item -> item.get("type"))
                .containsExactly("REPEATED_LOGIN_FAILURE", "DISABLED_ACCOUNT", "ABNORMAL_IP");
        assertThat(risks).allSatisfy(risk -> assertThat(risk)
                .containsKeys("id", "level", "type", "title", "description",
                        "username", "count", "lastSeen"));
        assertThat(risks).extracting(item -> item.get("level"))
                .containsExactly("high", "medium", "high");
        assertThat(risks.get(0).get("description").toString()).contains("7").contains("24");
        assertThat(risks.get(2).get("description").toString()).contains("203.0.113.8").contains("4");
    }

    @Test
    void returnsEmptyRiskListWhenThereIsNoRiskData() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString()))
                .thenReturn(List.of(), List.of(), List.of());

        assertThat(service.listRisks()).isEmpty();
    }

    @Test
    void operationLogFailureDoesNotEscapeIntoBusinessResponse() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        doThrow(new IllegalStateException("database unavailable"))
                .when(jdbcTemplate).update(anyString(), any(Object[].class));
        AdminSecurityService.AdminContext context =
                new AdminSecurityService.AdminContext(1L, "admin", "orders");

        assertThatCode(() -> service.recordOperation(
                context, "PUT", "/api/admin/orders/1", true, "127.0.0.1"))
                .doesNotThrowAnyException();
    }

    @Test
    void listRolesReturnsPermissionsAsArray() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(row(
                "id", 5L,
                "name", "审核员",
                "code", "AUDITOR",
                "permissions", "products:view,orders:view",
                "status", 1,
                "createTime", "2026-08-14 10:00:00"
        )));

        List<Map<String, Object>> roles = service.listRoles();

        assertThat(roles.get(0)).containsEntry("id", 5L)
                .containsEntry("name", "审核员")
                .containsEntry("code", "AUDITOR")
                .containsEntry("status", 1)
                .containsKey("createTime");
        assertThat(roles.get(0).get("permissions"))
                .isEqualTo(List.of("products:view", "orders:view"));
    }

    @Test
    void createRoleReturnsCreatedRoleWithPermissionArray() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        AdminRoleRequest request = new AdminRoleRequest();
        request.setName("客服");
        request.setCode("SUPPORT");
        request.setPermissions(List.of("users:view", "orders:view"));
        request.setStatus(1);
        when(jdbcTemplate.queryForList(anyString(), eq(1L)))
                .thenReturn(List.of(role("SUPER_ADMIN", "*")));
        when(jdbcTemplate.queryForList(anyString(), eq("SUPPORT"))).thenReturn(List.of(row(
                "id", 6L,
                "name", "客服",
                "code", "SUPPORT",
                "permissions", "users:view,orders:view",
                "status", 1,
                "createTime", "2026-08-14 10:00:00"
        )));

        Map<String, Object> created = service.createRole(1L, request);

        assertThat(created.get("id")).isEqualTo(6L);
        assertThat(created.get("permissions")).isEqualTo(List.of("users:view", "orders:view"));
        verify(jdbcTemplate).update(
                anyString(), eq("客服"), eq("SUPPORT"), eq("users:view,orders:view"), eq(1));
    }

    @Test
    void partialRoleUpdateKeepsMissingFieldsAndReturnsPermissionArray() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        AdminRoleRequest request = new AdminRoleRequest();
        request.setPermissions(List.of("products:view", "products:manage"));
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);
        when(jdbcTemplate.queryForList(anyString(), eq(1L)))
                .thenReturn(List.of(role("SUPER_ADMIN", "*")));
        when(jdbcTemplate.queryForList(anyString(), eq(7L))).thenReturn(
                List.of(row(
                        "id", 7L,
                        "name", "商品运营",
                        "code", "PRODUCT_OPERATOR",
                        "permissions", "products:view",
                        "status", 1,
                        "createTime", "2026-08-14 10:00:00"
                )),
                List.of(row(
                        "id", 7L,
                        "name", "商品运营",
                        "code", "PRODUCT_OPERATOR",
                        "permissions", "products:view,products:manage",
                        "status", 1,
                        "createTime", "2026-08-14 10:00:00"
                ))
        );

        Map<String, Object> updated = service.updateRole(1L, 7L, request);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).update(
                sql.capture(), eq("products:view,products:manage"), eq(7L));
        assertThat(sql.getValue()).contains("permissions = ?")
                .doesNotContain("name = ?")
                .doesNotContain("code = ?")
                .doesNotContain("status = ?");
        assertThat(updated.get("permissions"))
                .isEqualTo(List.of("products:view", "products:manage"));
    }

    @Test
    void limitedAdminCannotCreateRoleWithPermissionsTheyDoNotOwn() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        AdminRoleRequest request = roleRequest(
                "订单管理员", "ORDER_ADMIN", List.of("orders:view", "orders:manage"));
        when(jdbcTemplate.queryForList(anyString(), eq(12L)))
                .thenReturn(List.of(role("SECURITY_MANAGER", "security:manage,orders:view")));

        assertThatThrownBy(() -> service.createRole(12L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("不能授予当前操作者未拥有的权限")
                .hasMessageContaining("orders:manage");
    }

    @Test
    void limitedAdminCannotChangeRoleCodeToSuperAdmin() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        AdminRoleRequest request = new AdminRoleRequest();
        request.setCode("SUPER_ADMIN");
        when(jdbcTemplate.queryForList(anyString(), eq(12L)))
                .thenReturn(List.of(role("SECURITY_MANAGER", "security:manage")));
        when(jdbcTemplate.queryForList(anyString(), eq(7L))).thenReturn(List.of(row(
                "id", 7L, "name", "客服", "code", "SUPPORT",
                "permissions", "users:view", "status", 1,
                "createTime", "2026-08-14 10:00:00"
        )));

        assertThatThrownBy(() -> service.updateRole(12L, 7L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("只有超级管理员可以创建、修改或分配 SUPER_ADMIN 角色");
    }

    @Test
    void limitedAdminCannotExpandRolePermissionsOnUpdate() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        AdminRoleRequest request = new AdminRoleRequest();
        request.setPermissions(List.of("users:view", "users:manage"));
        when(jdbcTemplate.queryForList(anyString(), eq(12L)))
                .thenReturn(List.of(role("SECURITY_MANAGER", "security:manage,users:view")));
        when(jdbcTemplate.queryForList(anyString(), eq(7L))).thenReturn(List.of(row(
                "id", 7L, "name", "客服", "code", "SUPPORT",
                "permissions", "users:view", "status", 1,
                "createTime", "2026-08-14 10:00:00"
        )));

        assertThatThrownBy(() -> service.updateRole(12L, 7L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("users:manage");
    }

    @Test
    void limitedAdminCannotAssignSelfSuperAdminRole() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString(), eq(12L)))
                .thenReturn(List.of(role("SECURITY_MANAGER", "security:manage")));
        when(jdbcTemplate.queryForList(anyString(), eq(1L))).thenReturn(List.of(row(
                "id", 1L, "name", "超级管理员", "code", "SUPER_ADMIN",
                "permissions", "*", "status", 1,
                "createTime", "2026-08-14 10:00:00"
        )));

        assertThatThrownBy(() -> service.assignRole(12L, 12L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("只有超级管理员可以创建、修改或分配 SUPER_ADMIN 角色");
    }

    @Test
    void limitedAdminCannotAssignRoleWithPermissionsTheyDoNotOwn() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString(), eq(12L)))
                .thenReturn(List.of(role("SECURITY_MANAGER", "security:manage")));
        when(jdbcTemplate.queryForList(anyString(), eq(8L))).thenReturn(List.of(row(
                "id", 8L, "name", "用户管理员", "code", "USER_MANAGER",
                "permissions", "users:manage", "status", 1,
                "createTime", "2026-08-14 10:00:00"
        )));

        assertThatThrownBy(() -> service.assignRole(12L, 12L, 8L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("users:manage");
    }

    @Test
    void superAdminCanAssignSuperAdminRole() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString(), eq(1L)))
                .thenReturn(List.of(role("SUPER_ADMIN", "*")));
        when(jdbcTemplate.queryForList(anyString(), eq(99L))).thenReturn(List.of(row(
                "id", 99L, "name", "超级管理员", "code", "SUPER_ADMIN",
                "permissions", "*", "status", 1,
                "createTime", "2026-08-14 10:00:00"
        )));
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), eq(12L))).thenReturn(1L);

        assertThatCode(() -> service.assignRole(1L, 12L, 99L))
                .doesNotThrowAnyException();
    }

    @Test
    void roleUpdateRejectsRequestWithoutAnyFields() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);

        assertThatThrownBy(() -> service.updateRole(1L, 7L, new AdminRoleRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessage("角色更新至少需要提供一个字段");
    }

    @Test
    void roleUpdateRejectsProvidedBlankField() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        AdminRoleRequest request = new AdminRoleRequest();
        request.setName("   ");

        assertThatThrownBy(() -> service.updateRole(1L, 7L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("角色名称不能为空");
    }

    @Test
    void rolePermissionTextCannotExceedMysqlTextLimit() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        AdminRoleRequest request = roleRequest(
                "大权限角色", "LARGE_ROLE",
                java.util.stream.IntStream.range(0, 512)
                        .mapToObj(index -> "权".repeat(120) + index)
                        .toList());
        assertThatThrownBy(() -> service.createRole(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("角色权限数据不能超过 MySQL TEXT 的 65535 字节限制");
    }

    @Test
    void adminListIncludesBaseUserFieldsAndPermissionArray() {
        AdminSecurityService service = new AdminSecurityService(jdbcTemplate);
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(row(
                "id", 1L,
                "username", "admin",
                "status", 1,
                "role", 2,
                "createTime", "2026-08-14 09:00:00",
                "permissions", "*"
        )));

        List<Map<String, Object>> admins = service.listAdmins();

        assertThat(admins.get(0)).containsEntry("role", 2)
                .containsKey("createTime");
        assertThat(admins.get(0).get("permissions")).isEqualTo(List.of("*"));
    }

    private static Map<String, Object> user(Long id, String username, int role, int status) {
        return row("id", id, "username", username, "role", role, "status", status);
    }

    private static Map<String, Object> role(String code, String permissions) {
        return row("code", code, "permissions", permissions);
    }

    private static AdminRoleRequest roleRequest(
            String name, String code, List<String> permissions) {
        AdminRoleRequest request = new AdminRoleRequest();
        request.setName(name);
        request.setCode(code);
        request.setPermissions(permissions);
        request.setStatus(1);
        return request;
    }

    private static Map<String, Object> row(Object... values) {
        Map<String, Object> row = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            row.put((String) values[index], values[index + 1]);
        }
        return row;
    }
}
