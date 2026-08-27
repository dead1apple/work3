-- 优惠券每人限领升级迁移（MySQL 5.7）。
-- 仅在历史环境已创建 uk_user_template 唯一索引时执行；执行前请完成数据库备份。
-- 该唯一索引会阻止 per_user_limit 大于 1 的业务配置。

SET @drop_legacy_unique = (
    SELECT IF(COUNT(*) > 0,
        'ALTER TABLE user_coupon DROP INDEX uk_user_template',
        'SELECT 1')
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_coupon'
      AND index_name = 'uk_user_template'
);
PREPARE drop_legacy_unique_stmt FROM @drop_legacy_unique;
EXECUTE drop_legacy_unique_stmt;
DEALLOCATE PREPARE drop_legacy_unique_stmt;

SET @add_lookup_index = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE user_coupon ADD KEY idx_user_template (user_id, coupon_template_id)',
        'SELECT 1')
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_coupon'
      AND index_name = 'idx_user_template'
);
PREPARE add_lookup_index_stmt FROM @add_lookup_index;
EXECUTE add_lookup_index_stmt;
DEALLOCATE PREPARE add_lookup_index_stmt;
