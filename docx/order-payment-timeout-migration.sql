-- 订单支付超时和库存释放所需的数据库迁移。
-- 请在目标商城数据库中执行一次。

SET NAMES utf8mb4;

ALTER TABLE `order`
    ADD COLUMN `pay_deadline` DATETIME DEFAULT NULL COMMENT '支付截止时间' AFTER `coupon_id`,
    ADD KEY `idx_status_pay_deadline` (`status`, `pay_deadline`);

-- 为迁移前已经存在的待付款订单补齐截止时间。
UPDATE `order`
SET `pay_deadline` = DATE_ADD(`create_time`, INTERVAL 30 MINUTE)
WHERE `pay_deadline` IS NULL
  AND `status` = 0;

-- 支付状态约定：
-- 0 待支付，1 支付成功，2 支付失败，3 已退款，4 已过期。
