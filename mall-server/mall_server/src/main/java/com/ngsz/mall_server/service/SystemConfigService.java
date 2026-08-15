package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.pojo.dto.SystemConfigRequest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SystemConfigService {

    private static final String SMS_MOCK = "sms_mock_enabled";
    private static final String PAY_MOCK = "pay_mock_enabled";
    private static final String RECOMMENDED_PRODUCTS = "recommended_product_ids";

    private final JdbcTemplate jdbcTemplate;

    public SystemConfigService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getConfig() {
        Map<String, String> values = new LinkedHashMap<>();
        for (Map<String, Object> row : jdbcTemplate.queryForList("""
                SELECT config_key AS configKey, config_value AS configValue
                FROM system_config
                WHERE config_key IN ('sms_mock_enabled', 'pay_mock_enabled', 'recommended_product_ids')
                """)) {
            values.put(String.valueOf(value(row, "configKey", "config_key")),
                    String.valueOf(value(row, "configValue", "config_value")));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("smsMockEnabled", booleanValue(values.get(SMS_MOCK), true));
        response.put("payMockEnabled", booleanValue(values.get(PAY_MOCK), true));
        response.put("recommendedProductIds", productIds(values.get(RECOMMENDED_PRODUCTS)));
        return response;
    }

    @Transactional
    public void updateConfig(SystemConfigRequest request) {
        if (request == null || request.getSmsMockEnabled() == null
                || request.getPayMockEnabled() == null
                || request.getRecommendedProductIds() == null) {
            throw new BusinessException("系统配置不能为空");
        }
        LinkedHashSet<Long> productIds = new LinkedHashSet<>(request.getRecommendedProductIds());
        if (productIds.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new BusinessException("推荐商品 ID 必须大于 0");
        }
        upsert(SMS_MOCK, request.getSmsMockEnabled().toString());
        upsert(PAY_MOCK, request.getPayMockEnabled().toString());
        upsert(RECOMMENDED_PRODUCTS, productIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
    }

    public boolean isSmsMockEnabled(boolean fallback) {
        return booleanConfig(SMS_MOCK, fallback);
    }

    public boolean isPayMockEnabled(boolean fallback) {
        return booleanConfig(PAY_MOCK, fallback);
    }

    private boolean booleanConfig(String key, boolean fallback) {
        try {
            String value = jdbcTemplate.queryForObject("""
                    SELECT config_value FROM system_config WHERE config_key = ?
                    """, String.class, key);
            return booleanValue(value, fallback);
        } catch (DataAccessException exception) {
            return fallback;
        }
    }

    private void upsert(String key, String value) {
        jdbcTemplate.update("""
                INSERT INTO system_config (config_key, config_value, create_time, update_time)
                VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), update_time = CURRENT_TIMESTAMP
                """, key, value);
    }

    private static boolean booleanValue(String value, boolean fallback) {
        if (value == null) {
            return fallback;
        }
        if ("true".equalsIgnoreCase(value) || "1".equals(value)) {
            return true;
        }
        if ("false".equalsIgnoreCase(value) || "0".equals(value)) {
            return false;
        }
        return fallback;
    }

    private static List<Long> productIds(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return Arrays.stream(value.split(","))
                    .map(String::trim)
                    .filter(item -> !item.isEmpty())
                    .map(Long::valueOf)
                    .filter(id -> id > 0)
                    .distinct()
                    .toList();
        } catch (NumberFormatException exception) {
            return List.of();
        }
    }

    private static Object value(Map<String, Object> row, String preferred, String fallback) {
        return row.containsKey(preferred) ? row.get(preferred) : row.get(fallback);
    }
}
