package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.utils.RedisUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
public class VerificationCodeStore {

    private static final long CODE_TTL_SECONDS = 300;
    private static final long LOCK_TTL_SECONDS = 60;

    private final RedisUtils redisUtils;
    private final Clock clock;
    private final Map<String, ExpiringValue> codes = new ConcurrentHashMap<>();
    private final Map<String, ExpiringValue> locks = new ConcurrentHashMap<>();
    private final AtomicBoolean fallbackLogged = new AtomicBoolean();

    @Autowired
    public VerificationCodeStore(RedisUtils redisUtils) {
        this(redisUtils, Clock.systemUTC());
    }

    VerificationCodeStore(RedisUtils redisUtils, Clock clock) {
        this.redisUtils = redisUtils;
        this.clock = clock;
    }

    public void save(String phone, String code) {
        try {
            redisUtils.set(codeKey(phone), code, CODE_TTL_SECONDS);
            redisUtils.set(lockKey(phone), "1", LOCK_TTL_SECONDS);
        } catch (RuntimeException exception) {
            logFallback(exception);
        }
        codes.put(phone, expiring(code, CODE_TTL_SECONDS));
        locks.put(phone, expiring("1", LOCK_TTL_SECONDS));
    }

    public String get(String phone) {
        try {
            String value = redisUtils.getString(codeKey(phone));
            if (value != null) {
                return value;
            }
        } catch (RuntimeException exception) {
            logFallback(exception);
        }
        return value(codes, phone);
    }

    public boolean isLocked(String phone) {
        try {
            if (redisUtils.exists(lockKey(phone))) {
                return true;
            }
        } catch (RuntimeException exception) {
            logFallback(exception);
        }
        return value(locks, phone) != null;
    }

    public void delete(String phone) {
        try {
            redisUtils.delete(codeKey(phone));
        } catch (RuntimeException exception) {
            logFallback(exception);
        } finally {
            codes.remove(phone);
        }
    }

    private ExpiringValue expiring(String value, long ttlSeconds) {
        return new ExpiringValue(value, clock.millis() + ttlSeconds * 1000);
    }

    private String value(Map<String, ExpiringValue> values, String phone) {
        ExpiringValue current = values.get(phone);
        if (current == null) {
            return null;
        }
        if (current.expiresAtMillis() <= clock.millis()) {
            values.remove(phone, current);
            return null;
        }
        return current.value();
    }

    private void logFallback(RuntimeException exception) {
        if (fallbackLogged.compareAndSet(false, true)) {
            log.warn("Redis 不可用，短信验证码临时使用进程内存存储: {}", exception.getMessage());
        }
    }

    private static String codeKey(String phone) {
        return "sms:code:" + phone;
    }

    private static String lockKey(String phone) {
        return "sms:lock:" + phone;
    }

    private record ExpiringValue(String value, long expiresAtMillis) {
    }
}
