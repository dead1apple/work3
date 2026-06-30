package com.ngsz.mall_server.common.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.*;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;

@Component
public class RedisUtils {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private ValueOperations<String, Object> valueOps;
    private HashOperations<String, Object, Object> hashOps;
    private ListOperations<String, Object> listOps;
    private SetOperations<String, Object> setOps;

    @Autowired
    public void init() {
        valueOps = redisTemplate.opsForValue();
        hashOps = redisTemplate.opsForHash();
        listOps = redisTemplate.opsForList();
        setOps = redisTemplate.opsForSet();
    }

    public void set(String key, Object value) {
        valueOps.set(key, value);
    }

    public void set(String key, Object value, long timeoutSeconds) {
        valueOps.set(key, value, Duration.ofSeconds(timeoutSeconds));
    }

    public Object get(String key) {
        return valueOps.get(key);
    }

    public String getString(String key) {
        Object val = valueOps.get(key);
        return val == null ? null : val.toString();
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void expire(String key, long timeoutSeconds) {
        redisTemplate.expire(key, Duration.ofSeconds(timeoutSeconds));
    }

    public Long increment(String key) {
        return valueOps.increment(key);
    }

    public Long increment(String key, long delta) {
        return valueOps.increment(key, delta);
    }
}
