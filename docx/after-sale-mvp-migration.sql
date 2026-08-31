-- 售后工单 MVP 数据库迁移。
-- 只新增售后业务表，不修改订单、退款、商品和现有 OSS 配置。

CREATE TABLE IF NOT EXISTS `after_sale_ticket` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ticket_no` VARCHAR(32) NOT NULL COMMENT '售后工单号',
  `user_id` BIGINT NOT NULL COMMENT '申请用户 ID',
  `shop_id` BIGINT NOT NULL COMMENT '订单所属店铺 ID',
  `order_id` BIGINT NOT NULL COMMENT '订单 ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单号快照',
  `order_item_id` BIGINT NOT NULL COMMENT '订单明细 ID',
  `product_id` BIGINT NOT NULL COMMENT '商品 ID',
  `sku_id` BIGINT NOT NULL COMMENT 'SKU ID',
  `type` VARCHAR(32) NOT NULL COMMENT 'REFUND/RETURN_REFUND/EXCHANGE/RESEND',
  `reason_type` VARCHAR(32) NOT NULL COMMENT 'QUALITY/DAMAGED/WRONG_OR_MISSING/LOGISTICS/OTHER',
  `description` VARCHAR(1000) NOT NULL COMMENT '问题描述',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0待商家处理 1商家处理中 2待补充材料 3待用户确认 4平台处理中 5已解决 6已关闭 7已拒绝 8已取消',
  `reject_reason` VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
  `final_result` VARCHAR(500) DEFAULT NULL COMMENT '最终处理结果',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `close_time` DATETIME DEFAULT NULL,
  `deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_after_sale_ticket_no` (`ticket_no`),
  UNIQUE KEY `uk_after_sale_order_item` (`order_item_id`),
  KEY `idx_after_sale_user_status` (`user_id`, `status`, `deleted`),
  KEY `idx_after_sale_shop_status` (`shop_id`, `status`, `deleted`),
  KEY `idx_after_sale_status` (`status`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后工单主表';

CREATE TABLE IF NOT EXISTS `after_sale_attachment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ticket_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `url` VARCHAR(1000) NOT NULL COMMENT 'OSS 访问地址',
  `object_key` VARCHAR(500) NOT NULL COMMENT 'OSS ObjectKey',
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_size` BIGINT DEFAULT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_after_sale_attachment_ticket` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后工单 OSS 附件';

CREATE TABLE IF NOT EXISTS `after_sale_message` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ticket_id` BIGINT NOT NULL,
  `sender_id` BIGINT DEFAULT NULL COMMENT '用户/商家/管理员 ID',
  `sender_type` VARCHAR(16) NOT NULL COMMENT 'USER/MERCHANT/PLATFORM',
  `content` VARCHAR(1000) NOT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_after_sale_message_ticket` (`ticket_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后工单留言';

CREATE TABLE IF NOT EXISTS `after_sale_operation_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ticket_id` BIGINT NOT NULL,
  `operator_id` BIGINT DEFAULT NULL,
  `operator_type` VARCHAR(16) NOT NULL COMMENT 'USER/MERCHANT/PLATFORM/SYSTEM',
  `operation` VARCHAR(32) NOT NULL,
  `before_status` TINYINT DEFAULT NULL,
  `after_status` TINYINT DEFAULT NULL,
  `reason` VARCHAR(500) DEFAULT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_after_sale_operation_ticket` (`ticket_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后工单操作日志';
