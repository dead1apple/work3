-- 优惠券订单核销闭环迁移（MySQL 5.7）
-- 执行前请先备份数据库。MySQL 5.7 的 DDL 会隐式提交，不能依赖事务回滚。
-- 不建立 (user_id, coupon_template_id) 唯一索引，以支持 per_user_limit 大于 1 的券。
ALTER TABLE user_coupon
    MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0
    COMMENT '状态:0未使用 1已使用 2已过期 3已锁定待支付',
    MODIFY COLUMN order_no VARCHAR(50) DEFAULT NULL
    COMMENT '锁定或使用的订单号',
    ADD KEY idx_user_template (user_id, coupon_template_id),
    ADD KEY idx_order_status (order_no, status);

ALTER TABLE `order`
    ADD KEY idx_order_coupon_id (coupon_id);
