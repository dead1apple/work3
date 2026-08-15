package com.ngsz.mall_server.common.security;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.dto.AdminRoleRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdminSecurityService {

    private static final String SUPER_ADMIN = "SUPER_ADMIN";
    private static final int MAX_ROLE_NAME_LENGTH = 50;
    private static final int MAX_ROLE_CODE_LENGTH = 50;
    private static final int MAX_PERMISSION_COUNT = 512;
    private static final int MAX_PERMISSION_LENGTH = 128;
    private static final int MYSQL_TEXT_MAX_BYTES = 65_535;

    private static final Set<String> ADMIN_MODULES = Set.of(
            "dashboard", "audits", "users", "products", "orders",
            "shops", "coupons", "catalog", "config", "security"
    );

    private final JdbcTemplate jdbcTemplate;

    public AdminSecurityService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AdminContext authorize(Long userId, String method, String requestUri) {
        AdminContext context = loadAdminContext(userId, requestUri);
        checkPermission(context, method);
        return context;
    }

    public AdminContext loadAdminContext(Long userId, String requestUri) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList("""
                SELECT id, username, role, status
                FROM user
                WHERE id = ? AND deleted = 0
                """, userId);
        if (users.isEmpty()) {
            throw new BusinessException("管理员账号不存在");
        }

        Map<String, Object> user = users.get(0);
        if (number(user.get("role")) != 2) {
            throw new BusinessException("非管理员账号无权访问后台");
        }
        if (number(user.get("status")) != 1) {
            throw new BusinessException("管理员账号已被禁用");
        }

        String module = resolveModule(requestUri);
        return new AdminContext(userId, stringValue(user.get("username")), module);
    }

    public void checkPermission(AdminContext context, String method) {
        List<Map<String, Object>> roles = jdbcTemplate.queryForList("""
                SELECT r.code, r.permissions
                FROM admin_user_role aur
                JOIN admin_role r ON r.id = aur.role_id
                WHERE aur.user_id = ? AND r.status = 1
                """, context.userId());

        boolean superAdmin = roles.stream()
                .map(role -> stringValue(role.get("code")))
                .anyMatch(SUPER_ADMIN::equalsIgnoreCase);
        String requiredPermission = context.module()
                + ("GET".equalsIgnoreCase(method) ? ":view" : ":manage");
        if (!superAdmin && !permissions(roles).contains(requiredPermission)) {
            throw new BusinessException("缺少权限: " + requiredPermission);
        }
    }

    public List<Map<String, Object>> listRoles() {
        return jdbcTemplate.queryForList("""
                SELECT r.id, r.name, r.code, r.permissions, r.status,
                       r.create_time AS createTime, r.update_time AS updateTime,
                       COUNT(aur.user_id) AS adminCount
                FROM admin_role r
                LEFT JOIN admin_user_role aur ON aur.role_id = r.id
                GROUP BY r.id, r.name, r.code, r.permissions, r.status,
                         r.create_time, r.update_time
                ORDER BY r.id
                """).stream().map(this::roleResponse).toList();
    }

    public Map<String, Object> createRole(Long operatorId, AdminRoleRequest request) {
        RoleValues role = createRoleValues(request);
        OperatorAccess operator = operatorAccess(operatorId);
        authorizeRoleMutation(operator, role.code(), permissionList(role.permissions()));
        try {
            jdbcTemplate.update("""
                    INSERT INTO admin_role (name, code, permissions, status, create_time, update_time)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """, role.name(), role.code(), role.permissions(), role.status());
        } catch (DuplicateKeyException exception) {
            throw new BusinessException("角色编码已存在");
        }
        return findRoleByCode(role.code());
    }

    public Map<String, Object> updateRole(
            Long operatorId, Long id, AdminRoleRequest request) {
        validateRolePatch(request);
        Map<String, Object> existing = findRoleById(id);
        OperatorAccess operator = operatorAccess(operatorId);

        String currentCode = stringValue(existing.get("code"));
        String targetCode = request.getCode() == null
                ? currentCode : normalizeCode(request.getCode());
        List<String> targetPermissions = request.getPermissions() == null
                ? permissionList(existing.get("permissions"))
                : normalizePermissions(request.getPermissions());
        if ((SUPER_ADMIN.equalsIgnoreCase(currentCode)
                || SUPER_ADMIN.equalsIgnoreCase(targetCode)) && !operator.superAdmin()) {
            throw new BusinessException("只有超级管理员可以创建、修改或分配 SUPER_ADMIN 角色");
        }
        authorizeDelegatedPermissions(operator, targetPermissions);

        List<String> assignments = new ArrayList<>();
        List<Object> parameters = new ArrayList<>();
        if (request.getName() != null) {
            assignments.add("name = ?");
            parameters.add(normalizeName(request.getName()));
        }
        if (request.getCode() != null) {
            assignments.add("code = ?");
            parameters.add(targetCode);
        }
        if (request.getPermissions() != null) {
            assignments.add("permissions = ?");
            parameters.add(permissionText(targetPermissions));
        }
        if (request.getStatus() != null) {
            assignments.add("status = ?");
            parameters.add(normalizeStatus(request.getStatus()));
        }
        parameters.add(id);

        try {
            String sql = "UPDATE admin_role SET " + String.join(", ", assignments)
                    + ", update_time = CURRENT_TIMESTAMP WHERE id = ?";
            int updated = jdbcTemplate.update(sql, parameters.toArray());
            if (updated == 0) {
                throw new BusinessException("管理员角色不存在");
            }
        } catch (DuplicateKeyException exception) {
            throw new BusinessException("角色编码已存在");
        }
        return findRoleById(id);
    }

    public List<Map<String, Object>> listAdmins() {
        return jdbcTemplate.queryForList("""
                SELECT u.id, u.username, u.nickname, u.phone, u.email, u.status, u.role,
                       u.create_time AS createTime,
                       u.last_login_time AS lastLoginTime, u.last_login_ip AS lastLoginIp,
                       aur.role_id AS roleId, r.name AS roleName, r.code AS roleCode,
                       r.permissions
                FROM user u
                LEFT JOIN admin_user_role aur ON aur.user_id = u.id
                LEFT JOIN admin_role r ON r.id = aur.role_id
                WHERE u.role = 2 AND u.deleted = 0
                ORDER BY u.id
                """).stream().map(row -> {
            Map<String, Object> admin = new LinkedHashMap<>(row);
            admin.put("permissions", permissionList(row.get("permissions")));
            return admin;
        }).toList();
    }

    public void assignRole(Long operatorId, Long userId, Long roleId) {
        OperatorAccess operator = operatorAccess(operatorId);
        Map<String, Object> role = findRoleById(roleId);
        if (number(role.get("status")) != 1) {
            throw new BusinessException("可用的管理员角色不存在");
        }
        String roleCode = stringValue(role.get("code"));
        if (SUPER_ADMIN.equalsIgnoreCase(roleCode) && !operator.superAdmin()) {
            throw new BusinessException("只有超级管理员可以创建、修改或分配 SUPER_ADMIN 角色");
        }
        authorizeDelegatedPermissions(operator, permissionList(role.get("permissions")));

        Long adminCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM user
                WHERE id = ? AND role = 2 AND deleted = 0
                """, Long.class, userId);
        if (adminCount == null || adminCount == 0) {
            throw new BusinessException("管理员账号不存在");
        }

        jdbcTemplate.update("""
                INSERT INTO admin_user_role (user_id, role_id, create_time, update_time)
                VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), update_time = CURRENT_TIMESTAMP
                """, userId, roleId);
    }

    public PageResult<Map<String, Object>> listOperationLogs(
            Integer page, Integer size, String keyword) {
        PageBounds bounds = pageBounds(page, size);
        String normalizedKeyword = normalizeKeyword(keyword);
        String where = normalizedKeyword == null ? "" : """
                 WHERE admin_name LIKE ? OR module LIKE ? OR action LIKE ?
                    OR target LIKE ? OR detail LIKE ?
                """;
        List<Object> parameters = new ArrayList<>();
        if (normalizedKeyword != null) {
            for (int index = 0; index < 5; index++) {
                parameters.add(normalizedKeyword);
            }
        }

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM admin_operation_log" + where,
                Long.class,
                parameters.toArray());
        parameters.add(bounds.size());
        parameters.add(bounds.offset());
        List<Map<String, Object>> list = jdbcTemplate.queryForList("""
                SELECT id, admin_user_id AS adminUserId, admin_name AS adminName,
                       module, action, target, detail, success, ip,
                       create_time AS createTime
                FROM admin_operation_log
                """ + where + " ORDER BY create_time DESC, id DESC LIMIT ? OFFSET ?", parameters.toArray());
        return new PageResult<>(total == null ? 0L : total, list, bounds.page(), bounds.size());
    }

    public PageResult<Map<String, Object>> listLoginLogs(
            Integer page, Integer size, String keyword, Boolean success) {
        PageBounds bounds = pageBounds(page, size);
        String normalizedKeyword = normalizeKeyword(keyword);
        List<String> conditions = new ArrayList<>();
        List<Object> parameters = new ArrayList<>();
        if (normalizedKeyword != null) {
            conditions.add("(username LIKE ? OR ip LIKE ? OR message LIKE ?)");
            parameters.add(normalizedKeyword);
            parameters.add(normalizedKeyword);
            parameters.add(normalizedKeyword);
        }
        if (success != null) {
            conditions.add("success = ?");
            parameters.add(success);
        }
        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM login_log" + where,
                Long.class,
                parameters.toArray());
        parameters.add(bounds.size());
        parameters.add(bounds.offset());
        List<Map<String, Object>> list = jdbcTemplate.queryForList("""
                SELECT id, user_id AS userId, username, ip, success, message,
                       create_time AS createTime
                FROM login_log
                """ + where + " ORDER BY create_time DESC, id DESC LIMIT ? OFFSET ?", parameters.toArray());
        return new PageResult<>(total == null ? 0L : total, list, bounds.page(), bounds.size());
    }

    public List<Map<String, Object>> listRisks() {
        List<Map<String, Object>> risks = new ArrayList<>();
        List<Map<String, Object>> repeatedFailures = jdbcTemplate.queryForList("""
                SELECT username, COUNT(*) AS failureCount, MAX(create_time) AS lastFailureTime
                FROM login_log
                WHERE success = 0 AND create_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY username
                HAVING COUNT(*) >= 5
                ORDER BY failureCount DESC
                """);
        for (Map<String, Object> failure : repeatedFailures) {
            long count = longValue(value(failure, "failureCount", "failure_count"));
            String username = stringValue(failure.get("username"));
            risks.add(risk(
                    "repeated-login-failure:" + username,
                    "REPEATED_LOGIN_FAILURE", "high", "短时间多次登录失败",
                    username, count,
                    value(failure, "lastFailureTime", "last_failure_time"),
                    "账号 " + username + " 在最近 24 小时内登录失败 " + count + " 次"
            ));
        }

        List<Map<String, Object>> disabledAccounts = jdbcTemplate.queryForList("""
                SELECT id AS userId, username, role, update_time AS disabledSince
                FROM user
                WHERE status = 0 AND deleted = 0
                ORDER BY update_time DESC
                """);
        for (Map<String, Object> account : disabledAccounts) {
            String username = stringValue(account.get("username"));
            Map<String, Object> risk = risk(
                    "disabled-account:" + value(account, "userId", "user_id"),
                    "DISABLED_ACCOUNT", "medium", "账号已禁用",
                    username, 1,
                    value(account, "disabledSince", "disabled_since"),
                    "账号 " + username + " 当前处于禁用状态"
            );
            risk.put("userId", value(account, "userId", "user_id"));
            risk.put("role", account.get("role"));
            risks.add(risk);
        }

        List<Map<String, Object>> abnormalIps = jdbcTemplate.queryForList("""
                SELECT ip, COUNT(*) AS failureCount, COUNT(DISTINCT username) AS accountCount,
                       MAX(create_time) AS lastFailureTime
                FROM login_log
                WHERE success = 0 AND create_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                      AND ip IS NOT NULL AND ip <> ''
                GROUP BY ip
                HAVING COUNT(*) >= 10 OR COUNT(DISTINCT username) >= 3
                ORDER BY failureCount DESC
                """);
        for (Map<String, Object> ipRow : abnormalIps) {
            String ip = stringValue(ipRow.get("ip"));
            long failures = longValue(value(ipRow, "failureCount", "failure_count"));
            long accounts = longValue(value(ipRow, "accountCount", "account_count"));
            Map<String, Object> risk = risk(
                    "abnormal-ip:" + ip,
                    "ABNORMAL_IP", "high", "异常登录 IP",
                    null, failures,
                    value(ipRow, "lastFailureTime", "last_failure_time"),
                    "IP " + ip + " 在最近 24 小时内对 " + accounts
                            + " 个账号产生 " + failures + " 次失败登录"
            );
            risk.put("accountCount", accounts);
            risks.add(risk);
        }
        return risks;
    }

    public void recordOperation(
            AdminContext context, String method, String uri, boolean success, String ip) {
        try {
            jdbcTemplate.update("""
                    INSERT INTO admin_operation_log
                        (admin_user_id, admin_name, module, action, target, detail, success, ip, create_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, context.userId(), context.username(), context.module(), method,
                    uri, null, success, ip);
        } catch (Exception exception) {
            log.warn("管理员操作日志写入失败: adminUserId={}, method={}, uri={}",
                    context.userId(), method, uri, exception);
        }
    }

    private String resolveModule(String requestUri) {
        String prefix = "/api/admin/";
        if (requestUri == null || !requestUri.startsWith(prefix)) {
            throw new BusinessException("无法识别管理员接口模块");
        }
        String remaining = requestUri.substring(prefix.length());
        int separator = remaining.indexOf('/');
        String module = separator >= 0 ? remaining.substring(0, separator) : remaining;
        if (!ADMIN_MODULES.contains(module)) {
            throw new BusinessException("未知管理员模块: " + module);
        }
        return module;
    }

    private Set<String> permissions(List<Map<String, Object>> roles) {
        return roles.stream()
                .map(role -> stringValue(role.get("permissions")))
                .flatMap(value -> Arrays.stream(value.split(",")))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toSet());
    }

    private RoleValues createRoleValues(AdminRoleRequest request) {
        if (request == null) {
            throw new BusinessException("角色信息不能为空");
        }
        String name = normalizeName(request.getName());
        String code = normalizeCode(request.getCode());
        List<String> permissions = request.getPermissions() == null
                ? List.of() : normalizePermissions(request.getPermissions());
        int status = request.getStatus() == null ? 1 : normalizeStatus(request.getStatus());
        return new RoleValues(name, code, permissionText(permissions), status);
    }

    private OperatorAccess operatorAccess(Long operatorId) {
        List<Map<String, Object>> roles = jdbcTemplate.queryForList("""
                SELECT r.code, r.permissions
                FROM admin_user_role aur
                JOIN admin_role r ON r.id = aur.role_id
                WHERE aur.user_id = ? AND r.status = 1
                """, operatorId);
        if (roles.isEmpty()) {
            throw new BusinessException("当前操作者没有有效的管理员角色");
        }
        boolean superAdmin = roles.stream()
                .map(role -> stringValue(role.get("code")))
                .anyMatch(SUPER_ADMIN::equalsIgnoreCase);
        return new OperatorAccess(superAdmin, permissions(roles));
    }

    private void authorizeRoleMutation(
            OperatorAccess operator, String targetCode, List<String> targetPermissions) {
        if (SUPER_ADMIN.equalsIgnoreCase(targetCode) && !operator.superAdmin()) {
            throw new BusinessException("只有超级管理员可以创建、修改或分配 SUPER_ADMIN 角色");
        }
        authorizeDelegatedPermissions(operator, targetPermissions);
    }

    private void authorizeDelegatedPermissions(
            OperatorAccess operator, List<String> targetPermissions) {
        if (operator.superAdmin()) {
            return;
        }
        Set<String> missing = targetPermissions.stream()
                .filter(permission -> !operator.permissions().contains(permission))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (!missing.isEmpty()) {
            throw new BusinessException(
                    "不能授予当前操作者未拥有的权限: " + String.join(",", missing));
        }
    }

    private void validateRolePatch(AdminRoleRequest request) {
        if (request == null) {
            throw new BusinessException("角色信息不能为空");
        }
        if (request.getName() == null && request.getCode() == null
                && request.getPermissions() == null && request.getStatus() == null) {
            throw new BusinessException("角色更新至少需要提供一个字段");
        }
        if (request.getName() != null) {
            normalizeName(request.getName());
        }
        if (request.getCode() != null) {
            normalizeCode(request.getCode());
        }
        if (request.getPermissions() != null) {
            permissionText(normalizePermissions(request.getPermissions()));
        }
        if (request.getStatus() != null) {
            normalizeStatus(request.getStatus());
        }
    }

    private String normalizeName(String value) {
        String name = requiredText(value, "角色名称不能为空");
        if (name.length() > MAX_ROLE_NAME_LENGTH) {
            throw new BusinessException("角色名称不能超过 50 个字符");
        }
        return name;
    }

    private String normalizeCode(String value) {
        String code = requiredText(value, "角色编码不能为空").toUpperCase(Locale.ROOT);
        if (code.length() > MAX_ROLE_CODE_LENGTH) {
            throw new BusinessException("角色编码不能超过 50 个字符");
        }
        if (!code.matches("[A-Z][A-Z0-9_]{0,49}")) {
            throw new BusinessException("角色编码只能包含大写字母、数字和下划线");
        }
        return code;
    }

    private int normalizeStatus(Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException("角色状态只能是 0 或 1");
        }
        return status;
    }

    private List<String> normalizePermissions(List<String> requestedPermissions) {
        if (requestedPermissions.size() > MAX_PERMISSION_COUNT) {
            throw new BusinessException("角色权限数量不能超过 512");
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String permission : requestedPermissions) {
            if (permission == null || permission.isBlank()) {
                throw new BusinessException("角色权限项不能为空");
            }
            String value = permission.trim();
            if (value.length() > MAX_PERMISSION_LENGTH) {
                throw new BusinessException("单个角色权限不能超过 128 个字符");
            }
            normalized.add(value);
        }
        return List.copyOf(normalized);
    }

    private String permissionText(List<String> permissions) {
        String text = String.join(",", permissions);
        if (text.getBytes(StandardCharsets.UTF_8).length > MYSQL_TEXT_MAX_BYTES) {
            throw new BusinessException("角色权限数据不能超过 MySQL TEXT 的 65535 字节限制");
        }
        return text;
    }

    private Map<String, Object> findRoleById(Long id) {
        List<Map<String, Object>> roles = jdbcTemplate.queryForList("""
                SELECT id, name, code, permissions, status,
                       create_time AS createTime, update_time AS updateTime
                FROM admin_role WHERE id = ?
                """, id);
        if (roles.isEmpty()) {
            throw new BusinessException("管理员角色不存在");
        }
        return roleResponse(roles.get(0));
    }

    private Map<String, Object> findRoleByCode(String code) {
        List<Map<String, Object>> roles = jdbcTemplate.queryForList("""
                SELECT id, name, code, permissions, status,
                       create_time AS createTime, update_time AS updateTime
                FROM admin_role WHERE code = ?
                """, code);
        if (roles.isEmpty()) {
            throw new BusinessException("管理员角色不存在");
        }
        return roleResponse(roles.get(0));
    }

    private Map<String, Object> roleResponse(Map<String, Object> row) {
        Map<String, Object> role = new LinkedHashMap<>();
        role.put("id", row.get("id"));
        role.put("name", row.get("name"));
        role.put("code", row.get("code"));
        role.put("permissions", permissionList(row.get("permissions")));
        role.put("status", row.get("status"));
        role.put("createTime", value(row, "createTime", "create_time"));
        if (row.containsKey("updateTime") || row.containsKey("update_time")) {
            role.put("updateTime", value(row, "updateTime", "update_time"));
        }
        if (row.containsKey("adminCount") || row.containsKey("admin_count")) {
            role.put("adminCount", value(row, "adminCount", "admin_count"));
        }
        return role;
    }

    private List<String> permissionList(Object value) {
        if (value instanceof List<?> values) {
            return values.stream()
                    .filter(item -> item != null && !item.toString().trim().isEmpty())
                    .map(item -> item.toString().trim())
                    .toList();
        }
        return Arrays.stream(stringValue(value).split(","))
                .map(String::trim)
                .filter(permission -> !permission.isEmpty())
                .toList();
    }

    private static PageBounds pageBounds(Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 20 : Math.min(size, 200);
        return new PageBounds(safePage, safeSize, (safePage - 1) * safeSize);
    }

    private static String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return "%" + keyword.trim() + "%";
    }

    private static Map<String, Object> risk(
            String id, String type, String level, String title, String username, long count,
            Object lastSeen, String description) {
        Map<String, Object> risk = new LinkedHashMap<>();
        risk.put("id", id);
        risk.put("level", level);
        risk.put("type", type);
        risk.put("title", title);
        risk.put("description", description);
        risk.put("username", username);
        risk.put("count", count);
        risk.put("lastSeen", lastSeen);
        return risk;
    }

    private static Object value(Map<String, Object> row, String preferred, String fallback) {
        return row.containsKey(preferred) ? row.get(preferred) : row.get(fallback);
    }

    private static int number(Object value) {
        return value instanceof Number number ? number.intValue() : Integer.parseInt(stringValue(value));
    }

    private static long longValue(Object value) {
        return value instanceof Number number ? number.longValue() : Long.parseLong(stringValue(value));
    }

    private static String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    private static String requiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BusinessException(message);
        }
        return value.trim();
    }

    public record AdminContext(Long userId, String username, String module) {
    }

    private record RoleValues(String name, String code, String permissions, int status) {
    }

    private record OperatorAccess(boolean superAdmin, Set<String> permissions) {
    }

    private record PageBounds(int page, int size, int offset) {
    }
}
