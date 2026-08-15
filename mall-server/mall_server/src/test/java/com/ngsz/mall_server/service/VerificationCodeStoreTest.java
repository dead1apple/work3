package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.utils.RedisUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VerificationCodeStoreTest {

    @Mock private RedisUtils redisUtils;
    private VerificationCodeStore store;

    @BeforeEach
    void setUp() {
        store = new VerificationCodeStore(redisUtils);
    }

    @Test
    void keepsMockCodeAndRateLimitInMemoryWhenRedisIsUnavailable() {
        doThrow(new DataAccessResourceFailureException("redis unavailable"))
                .when(redisUtils).set(anyString(), anyString(), org.mockito.ArgumentMatchers.anyLong());
        when(redisUtils.getString(anyString()))
                .thenThrow(new DataAccessResourceFailureException("redis unavailable"));
        when(redisUtils.exists(anyString()))
                .thenThrow(new DataAccessResourceFailureException("redis unavailable"));

        store.save("13800138000", "123456");

        assertThat(store.get("13800138000")).isEqualTo("123456");
        assertThat(store.isLocked("13800138000")).isTrue();
    }

    @Test
    void deletesFallbackCodeEvenWhenRedisDeleteFails() {
        doThrow(new DataAccessResourceFailureException("redis unavailable"))
                .when(redisUtils).set(anyString(), anyString(), org.mockito.ArgumentMatchers.anyLong());
        doThrow(new DataAccessResourceFailureException("redis unavailable"))
                .when(redisUtils).delete(anyString());
        when(redisUtils.getString(anyString()))
                .thenThrow(new DataAccessResourceFailureException("redis unavailable"));
        store.save("13800138000", "123456");

        store.delete("13800138000");

        assertThat(store.get("13800138000")).isNull();
    }
}
