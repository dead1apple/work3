package com.ngsz.mall_server.service;

import com.ngsz.mall_server.pojo.dto.SystemConfigRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemConfigServiceTest {

    @Mock private JdbcTemplate jdbcTemplate;
    @InjectMocks private SystemConfigService service;

    @Test
    void returnsTypedAdminConfiguration() {
        when(jdbcTemplate.queryForList(contains("FROM system_config")))
                .thenReturn(List.of(
                        Map.of("configKey", "sms_mock_enabled", "configValue", "false"),
                        Map.of("configKey", "pay_mock_enabled", "configValue", "true"),
                        Map.of("configKey", "recommended_product_ids", "configValue", "2,4,9")
                ));

        Map<String, Object> config = service.getConfig();

        assertThat(config.get("smsMockEnabled")).isEqualTo(false);
        assertThat(config.get("payMockEnabled")).isEqualTo(true);
        assertThat(config.get("recommendedProductIds")).isEqualTo(List.of(2L, 4L, 9L));
    }

    @Test
    void upsertsEveryConfigurationValue() {
        SystemConfigRequest request = new SystemConfigRequest();
        request.setSmsMockEnabled(true);
        request.setPayMockEnabled(false);
        request.setRecommendedProductIds(List.of(5L, 7L));

        service.updateConfig(request);

        verify(jdbcTemplate).update(contains("system_config"), eq("sms_mock_enabled"), eq("true"));
        verify(jdbcTemplate).update(contains("system_config"), eq("pay_mock_enabled"), eq("false"));
        verify(jdbcTemplate).update(contains("system_config"), eq("recommended_product_ids"), eq("5,7"));
    }

    @Test
    void runtimeMockSwitchFallsBackToApplicationPropertyWhenMissing() {
        when(jdbcTemplate.queryForObject(
                contains("FROM system_config"), eq(String.class), eq("sms_mock_enabled")))
                .thenThrow(new EmptyResultDataAccessException(1));

        assertThat(service.isSmsMockEnabled(true)).isTrue();
    }
}
