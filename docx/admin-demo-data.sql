-- Admin platform demo data. Select the target mall database before running.
-- The statements are idempotent and can be executed repeatedly.

SET NAMES utf8mb4;

INSERT INTO `user`
  (`username`, `password`, `nickname`, `phone`, `email`, `gender`, `status`, `role`)
SELECT
  'pendingmerchant',
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
  '待审核商家', '13900002001', 'pendingmerchant@mall.test', 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `user` WHERE `username` = 'pendingmerchant');

INSERT INTO `user`
  (`username`, `password`, `nickname`, `phone`, `email`, `gender`, `status`, `role`)
SELECT
  'rejectedmerchant',
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
  '已驳回商家', '13900002002', 'rejectedmerchant@mall.test', 2, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `user` WHERE `username` = 'rejectedmerchant');

INSERT INTO `shop` (`user_id`, `shop_name`, `description`, `status`, `rating`)
SELECT u.id, '星河数码待审核店', '用于演示店铺审核通过和驳回流程', 0, 4.6
FROM `user` u
WHERE u.username = 'pendingmerchant'
  AND NOT EXISTS (SELECT 1 FROM `shop` WHERE `shop_name` = '星河数码待审核店');

INSERT INTO `shop` (`user_id`, `shop_name`, `description`, `status`, `rating`)
SELECT u.id, '旧物精选已驳回店', '用于演示已驳回店铺状态', 2, 3.8
FROM `user` u
WHERE u.username = 'rejectedmerchant'
  AND NOT EXISTS (SELECT 1 FROM `shop` WHERE `shop_name` = '旧物精选已驳回店');

INSERT INTO `product`
  (`category_id`, `brand_id`, `shop_id`, `name`, `subtitle`, `main_image`, `status`, `sales_count`, `sort_order`)
SELECT 11, 1, 4, 'Nova Fold 概念测试机', '待审核商品，用于前端审核流程联调',
       'https://picsum.photos/seed/admin-pending-product/600/600', 2, 0, 99
WHERE NOT EXISTS (SELECT 1 FROM `product` WHERE `name` = 'Nova Fold 概念测试机');

INSERT INTO `product`
  (`category_id`, `brand_id`, `shop_id`, `name`, `subtitle`, `main_image`, `status`, `sales_count`, `sort_order`)
SELECT 12, 2, 4, 'Demo Pods 已驳回款', '已驳回商品，用于状态筛选联调',
       'https://picsum.photos/seed/admin-rejected-product/600/600', 0, 0, 100
WHERE NOT EXISTS (SELECT 1 FROM `product` WHERE `name` = 'Demo Pods 已驳回款');

INSERT INTO `sku`
  (`product_id`, `sku_name`, `spec_values`, `price`, `market_price`, `stock`, `sku_code`, `weight`, `status`)
SELECT p.id, 'Nova Fold 12+512GB', '{"颜色":"曜石黑","容量":"12+512GB"}',
       5999.00, 6999.00, 50, 'DEMO-NOVA-FOLD', 0.25, 1
FROM `product` p
WHERE p.name = 'Nova Fold 概念测试机'
  AND NOT EXISTS (SELECT 1 FROM `sku` WHERE `sku_code` = 'DEMO-NOVA-FOLD');

INSERT INTO `sku`
  (`product_id`, `sku_name`, `spec_values`, `price`, `market_price`, `stock`, `sku_code`, `weight`, `status`)
SELECT p.id, 'Demo Pods 标准版', '{"颜色":"白色"}',
       399.00, 499.00, 30, 'DEMO-PODS-REJECTED', 0.05, 0
FROM `product` p
WHERE p.name = 'Demo Pods 已驳回款'
  AND NOT EXISTS (SELECT 1 FROM `sku` WHERE `sku_code` = 'DEMO-PODS-REJECTED');

INSERT INTO `coupon_template`
  (`shop_id`, `name`, `type`, `amount`, `min_amount`, `total_count`, `issued_count`, `used_count`, `start_time`, `end_time`, `status`)
SELECT NULL, '前端联调无门槛券', 3, 20.00, 0.00, 500, 35, 8,
       '2026-01-01 00:00:00', '2027-12-31 23:59:59', 1
WHERE NOT EXISTS (SELECT 1 FROM `coupon_template` WHERE `name` = '前端联调无门槛券');

INSERT INTO `order`
  (`order_no`, `user_id`, `shop_id`, `total_amount`, `pay_amount`, `freight_amount`,
   `discount_amount`, `status`, `receiver_name`, `receiver_phone`, `receiver_address`,
   `cancel_time`, `cancel_reason`, `remark`)
SELECT 'DEMO-CLOSE-2026', 3, 1, 99.00, 99.00, 0.00, 0.00, 4,
       '联调用户', '13900003001', '广东省深圳市南山区联调路 1 号',
       NOW(), '联调验证管理员关单', '管理员关单演示'
WHERE NOT EXISTS (SELECT 1 FROM `order` WHERE `order_no` = 'DEMO-CLOSE-2026');

INSERT INTO `order`
  (`order_no`, `user_id`, `shop_id`, `total_amount`, `pay_amount`, `freight_amount`,
   `discount_amount`, `status`, `receiver_name`, `receiver_phone`, `receiver_address`,
   `pay_type`, `pay_time`, `cancel_time`, `cancel_reason`, `remark`)
SELECT 'DEMO-REFUND-2026', 3, 1, 199.00, 199.00, 0.00, 0.00, 5,
       '联调用户', '13900003002', '广东省深圳市南山区联调路 2 号',
       1, NOW(), NOW(), '全额退款: 联调验证全额退款', '管理员退款演示'
WHERE NOT EXISTS (SELECT 1 FROM `order` WHERE `order_no` = 'DEMO-REFUND-2026');

INSERT INTO `payment`
  (`payment_no`, `order_no`, `user_id`, `pay_type`, `amount`, `status`, `third_party_no`, `pay_time`)
SELECT 'PAY-DEMO-REFUND-2026', 'DEMO-REFUND-2026', 3, 1, 199.00, 3,
       'MOCK_DEMO_REFUND', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `payment` WHERE `payment_no` = 'PAY-DEMO-REFUND-2026');

INSERT INTO `refund_record`
  (`refund_no`, `order_id`, `order_no`, `user_id`, `amount`, `reason`, `status`,
   `operator_id`, `operator_name`, `create_time`, `update_time`)
SELECT 'RF-DEMO-REFUND-2026', o.id, o.order_no, o.user_id, 199.00,
       '联调验证全额退款', 1, 1, 'admin', NOW(), NOW()
FROM `order` o
WHERE o.order_no = 'DEMO-REFUND-2026'
  AND NOT EXISTS (SELECT 1 FROM `refund_record` WHERE `order_no` = 'DEMO-REFUND-2026');

INSERT INTO `login_log` (`user_id`, `username`, `ip`, `success`, `message`, `create_time`)
SELECT NULL, 'risk-demo', '203.0.113.42', 0, 'DEMO_RISK_SEED',
       DATE_SUB(NOW(), INTERVAL attempts.seq MINUTE)
FROM (
  SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) attempts
WHERE NOT EXISTS (
  SELECT 1 FROM `login_log`
  WHERE `username` = 'risk-demo' AND `message` = 'DEMO_RISK_SEED'
);

INSERT INTO `audit_record`
  (`target_type`, `target_id`, `target_name`, `action`, `before_status`, `after_status`,
   `reason`, `detail`, `admin_user_id`, `admin_name`, `create_time`)
SELECT 'product', p.id, p.name, 'reject', '2', '0',
       '演示：商品资料需要补充', 'DEMO_HISTORY_REJECT', 1, 'admin', DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM `product` p
WHERE p.name = 'Demo Pods 已驳回款'
  AND NOT EXISTS (SELECT 1 FROM `audit_record` WHERE `detail` = 'DEMO_HISTORY_REJECT');

INSERT INTO `audit_record`
  (`target_type`, `target_id`, `target_name`, `action`, `before_status`, `after_status`,
   `reason`, `detail`, `admin_user_id`, `admin_name`, `create_time`)
SELECT 'shop', s.id, s.shop_name, 'disable', '1', '0',
       '演示：店铺临时停用', 'DEMO_HISTORY_DISABLE', 1, 'admin', DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM `shop` s
WHERE s.shop_name = '商城自营'
  AND NOT EXISTS (SELECT 1 FROM `audit_record` WHERE `detail` = 'DEMO_HISTORY_DISABLE');

INSERT INTO `audit_record`
  (`target_type`, `target_id`, `target_name`, `action`, `before_status`, `after_status`,
   `reason`, `detail`, `admin_user_id`, `admin_name`, `create_time`)
SELECT 'shop', s.id, s.shop_name, 'enable', '0', '1',
       '演示：店铺恢复营业', 'DEMO_HISTORY_ENABLE', 1, 'admin', DATE_SUB(NOW(), INTERVAL 12 HOUR)
FROM `shop` s
WHERE s.shop_name = '商城自营'
  AND NOT EXISTS (SELECT 1 FROM `audit_record` WHERE `detail` = 'DEMO_HISTORY_ENABLE');
