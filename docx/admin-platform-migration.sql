SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `admin_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `permissions` TEXT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_role_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色';

CREATE TABLE IF NOT EXISTS `admin_user_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_user_role_user` (`user_id`),
  KEY `idx_admin_user_role_role` (`role_id`),
  CONSTRAINT `fk_admin_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk_admin_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `admin_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员用户角色关联';

CREATE TABLE IF NOT EXISTS `admin_operation_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT NOT NULL,
  `admin_name` VARCHAR(50) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `action` VARCHAR(20) NOT NULL,
  `target` VARCHAR(500) DEFAULT NULL,
  `detail` TEXT DEFAULT NULL,
  `success` TINYINT NOT NULL DEFAULT 1,
  `ip` VARCHAR(50) DEFAULT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_operation_admin_time` (`admin_user_id`, `create_time`),
  KEY `idx_admin_operation_module_time` (`module`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志';

CREATE TABLE IF NOT EXISTS `login_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT DEFAULT NULL,
  `username` VARCHAR(50) NOT NULL,
  `ip` VARCHAR(50) DEFAULT NULL,
  `success` TINYINT NOT NULL,
  `message` VARCHAR(255) DEFAULT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_login_log_username_time` (`username`, `create_time`),
  KEY `idx_login_log_ip_time` (`ip`, `create_time`),
  KEY `idx_login_log_success_time` (`success`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志';

CREATE TABLE IF NOT EXISTS `audit_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `target_type` VARCHAR(30) NOT NULL,
  `target_id` BIGINT NOT NULL,
  `target_name` VARCHAR(255) DEFAULT NULL,
  `action` VARCHAR(30) NOT NULL,
  `before_status` VARCHAR(30) DEFAULT NULL,
  `after_status` VARCHAR(30) DEFAULT NULL,
  `reason` VARCHAR(500) DEFAULT NULL,
  `detail` TEXT DEFAULT NULL,
  `admin_user_id` BIGINT NOT NULL,
  `admin_name` VARCHAR(50) NOT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_record_target` (`target_type`, `target_id`),
  KEY `idx_audit_record_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核记录';

CREATE TABLE IF NOT EXISTS `refund_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `refund_no` VARCHAR(64) NOT NULL,
  `order_id` BIGINT NOT NULL,
  `order_no` VARCHAR(64) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `reason` VARCHAR(500) DEFAULT NULL,
  `status` TINYINT NOT NULL DEFAULT 0,
  `operator_id` BIGINT DEFAULT NULL,
  `operator_name` VARCHAR(50) DEFAULT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_record_no` (`refund_no`),
  KEY `idx_refund_record_order` (`order_id`),
  KEY `idx_refund_record_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款记录';

CREATE TABLE IF NOT EXISTS `system_config` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(100) NOT NULL,
  `config_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_system_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置';

INSERT INTO `admin_role` (`name`, `code`, `permissions`, `status`)
VALUES ('超级管理员', 'SUPER_ADMIN', '*', 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `permissions` = VALUES(`permissions`),
  `status` = VALUES(`status`),
  `update_time` = CURRENT_TIMESTAMP;

INSERT INTO `admin_user_role` (`user_id`, `role_id`)
SELECT u.`id`, r.`id`
FROM `user` u
JOIN `admin_role` r ON r.`code` = 'SUPER_ADMIN'
WHERE u.`username` = 'admin' AND u.`role` = 2 AND u.`deleted` = 0
ON DUPLICATE KEY UPDATE
  `role_id` = VALUES(`role_id`),
  `update_time` = CURRENT_TIMESTAMP;

INSERT INTO `system_config` (`config_key`, `config_value`, `description`)
VALUES ('sms_mock_enabled', 'true', '是否启用短信模拟')
ON DUPLICATE KEY UPDATE
  `config_value` = VALUES(`config_value`),
  `description` = VALUES(`description`),
  `update_time` = CURRENT_TIMESTAMP;

INSERT INTO `system_config` (`config_key`, `config_value`, `description`)
VALUES ('pay_mock_enabled', 'true', '是否启用支付模拟')
ON DUPLICATE KEY UPDATE
  `config_value` = VALUES(`config_value`),
  `description` = VALUES(`description`),
  `update_time` = CURRENT_TIMESTAMP;

INSERT INTO `system_config` (`config_key`, `config_value`, `description`)
VALUES ('recommended_product_ids', '1,2,3,4', '后台推荐商品 ID')
ON DUPLICATE KEY UPDATE
  `config_value` = VALUES(`config_value`),
  `description` = VALUES(`description`),
  `update_time` = CURRENT_TIMESTAMP;
