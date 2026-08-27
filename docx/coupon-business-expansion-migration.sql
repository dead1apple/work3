-- 优惠券业务扩展迁移（MySQL 5.7）
-- 前置条件：已执行 coupon-order-closure-migration.sql，且已完成数据库备份。
-- 本脚本包含 DDL，MySQL 5.7 会隐式提交；请在低峰期一次执行。

ALTER TABLE coupon_template
    ADD COLUMN receive_start_time DATETIME NULL COMMENT '领取开始时间，空值回退 start_time' AFTER end_time,
    ADD COLUMN receive_end_time DATETIME NULL COMMENT '领取结束时间，空值回退 end_time' AFTER receive_start_time,
    ADD COLUMN use_start_time DATETIME NULL COMMENT '使用开始时间，空值回退 start_time' AFTER receive_end_time,
    ADD COLUMN use_end_time DATETIME NULL COMMENT '使用结束时间，空值回退 end_time' AFTER use_start_time,
    ADD COLUMN per_user_limit INT NOT NULL DEFAULT 1 COMMENT '每人限领数' AFTER total_count,
    ADD COLUMN max_discount_amount DECIMAL(10,2) NULL COMMENT '折扣券最高优惠金额' AFTER min_amount,
    ADD COLUMN update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER create_time,
    ADD KEY idx_coupon_receive_window (shop_id, status, receive_start_time, receive_end_time);

ALTER TABLE user_coupon
    ADD COLUMN lock_time DATETIME NULL COMMENT '订单锁券时间' AFTER use_time,
    ADD COLUMN effective_start_time DATETIME NULL COMMENT '领取时固化的使用开始时间' AFTER lock_time,
    ADD COLUMN effective_end_time DATETIME NULL COMMENT '领取时固化的使用结束时间' AFTER effective_start_time,
    ADD COLUMN status_update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER effective_end_time,
    ADD KEY idx_user_coupon_status_end (user_id, status, effective_end_time);

-- 回填历史券的有效期；新券会在领取时由服务端写入快照。
UPDATE user_coupon uc
JOIN coupon_template ct ON ct.id = uc.coupon_template_id
SET uc.effective_start_time = COALESCE(uc.effective_start_time, ct.use_start_time, ct.start_time),
    uc.effective_end_time = COALESCE(uc.effective_end_time, ct.use_end_time, ct.end_time)
WHERE uc.effective_start_time IS NULL OR uc.effective_end_time IS NULL;

CREATE TABLE coupon_operation_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    coupon_template_id BIGINT NOT NULL,
    user_coupon_id BIGINT NULL,
    user_id BIGINT NULL,
    order_no VARCHAR(50) NULL,
    operation_type VARCHAR(20) NOT NULL COMMENT 'CLAIM/LOCK/RELEASE/USE/EXPIRE',
    operator_type VARCHAR(20) NOT NULL COMMENT 'USER/ADMIN/MERCHANT/SYSTEM',
    operator_id BIGINT NULL,
    reason VARCHAR(255) NULL,
    detail VARCHAR(1000) NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_coupon_operation_template_time (coupon_template_id, create_time),
    KEY idx_coupon_operation_user_time (user_coupon_id, create_time),
    KEY idx_coupon_operation_order (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券业务操作流水';

CREATE TABLE order_coupon_snapshot (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    order_no VARCHAR(50) NOT NULL,
    user_coupon_id BIGINT NOT NULL,
    coupon_template_id BIGINT NOT NULL,
    shop_id BIGINT NULL,
    coupon_name VARCHAR(100) NOT NULL,
    coupon_type TINYINT NOT NULL,
    coupon_amount DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) NULL,
    goods_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    pay_amount DECIMAL(12,2) NOT NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_coupon_snapshot_order (order_no),
    KEY idx_order_coupon_snapshot_template (coupon_template_id),
    KEY idx_order_coupon_snapshot_user_coupon (user_coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单优惠券规则快照';

-- 上线后核验：不应有未使用且有效期已结束的用户券。
SELECT COUNT(*) AS expired_unused_coupon_count
FROM user_coupon
WHERE status = 0 AND effective_end_time < NOW();
