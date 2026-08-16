-- ============================================================
-- 京东商城数据库 (jd_mall)
-- ============================================================
CREATE DATABASE IF NOT EXISTS `jd_mall` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `jd_mall`;

-- ============================================================
-- 1. 用户模块
-- ============================================================

-- 用户表
CREATE TABLE `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(128) NOT NULL COMMENT '密码(BCrypt加密)',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别:0未知 1男 2女',
  `birthday` DATE DEFAULT NULL COMMENT '生日',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
  `role` TINYINT NOT NULL DEFAULT 0 COMMENT '角色:0普通用户 1商家 2管理员',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0否 1是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户收货地址表
CREATE TABLE `user_address` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `receiver_name` VARCHAR(50) NOT NULL COMMENT '收货人姓名',
  `receiver_phone` VARCHAR(20) NOT NULL COMMENT '收货人电话',
  `province` VARCHAR(50) NOT NULL COMMENT '省',
  `city` VARCHAR(50) NOT NULL COMMENT '市',
  `district` VARCHAR(50) NOT NULL COMMENT '区',
  `detail_address` VARCHAR(200) NOT NULL COMMENT '详细地址',
  `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认地址',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收货地址表';

-- ============================================================
-- 2. 商品模块
-- ============================================================

-- 商品分类表(三级分类)
CREATE TABLE `category` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT NOT NULL DEFAULT 0 COMMENT '父分类ID,0为顶级',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `level` TINYINT NOT NULL DEFAULT 1 COMMENT '分类层级:1 2 3',
  `icon` VARCHAR(500) DEFAULT NULL COMMENT '分类图标',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 品牌表
CREATE TABLE `brand` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '品牌名称',
  `logo` VARCHAR(500) DEFAULT NULL COMMENT '品牌logo',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '品牌描述',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` TINYINT NOT NULL DEFAULT 1,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='品牌表';

-- 店铺表
CREATE TABLE `shop` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '商家用户ID',
  `shop_name` VARCHAR(100) NOT NULL COMMENT '店铺名称',
  `logo` VARCHAR(500) DEFAULT NULL COMMENT '店铺logo',
  `description` VARCHAR(1000) DEFAULT NULL COMMENT '店铺描述',
  `license_image` VARCHAR(500) DEFAULT NULL COMMENT '营业执照',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0待审核 1正常 2封禁',
  `rating` DECIMAL(2,1) DEFAULT 5.0 COMMENT '店铺评分',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺表';

-- 商品SPU表
CREATE TABLE `product` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT NOT NULL COMMENT '分类ID',
  `brand_id` BIGINT DEFAULT NULL COMMENT '品牌ID',
  `shop_id` BIGINT NOT NULL COMMENT '店铺ID(商家)',
  `name` VARCHAR(200) NOT NULL COMMENT '商品名称',
  `subtitle` VARCHAR(500) DEFAULT NULL COMMENT '副标题',
  `main_image` VARCHAR(500) DEFAULT NULL COMMENT '主图URL',
  `images` TEXT DEFAULT NULL COMMENT '商品图片列表(逗号分隔)',
  `detail` TEXT DEFAULT NULL COMMENT '商品详情(富文本)',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0下架 1上架 2待审核',
  `sales_count` INT NOT NULL DEFAULT 0 COMMENT '销量',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_shop_id` (`shop_id`),
  KEY `idx_brand_id` (`brand_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品SPU表';

-- 商品SKU表
CREATE TABLE `sku` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT NOT NULL COMMENT '商品SPU ID',
  `sku_name` VARCHAR(200) NOT NULL COMMENT 'SKU名称',
  `spec_values` VARCHAR(500) DEFAULT NULL COMMENT '规格值(JSON)',
  `price` DECIMAL(10,2) NOT NULL COMMENT '售价',
  `market_price` DECIMAL(10,2) DEFAULT NULL COMMENT '市场价/原价',
  `cost_price` DECIMAL(10,2) DEFAULT NULL COMMENT '成本价',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
  `locked_stock` INT NOT NULL DEFAULT 0 COMMENT '锁定库存',
  `image` VARCHAR(500) DEFAULT NULL COMMENT 'SKU图片',
  `sku_code` VARCHAR(100) DEFAULT NULL COMMENT 'SKU编码',
  `weight` DECIMAL(10,2) DEFAULT NULL COMMENT '重量(kg)',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1正常',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品SKU表';

-- ============================================================
-- 3. 购物车 & 收藏
-- ============================================================

-- 购物车表
CREATE TABLE `cart` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `sku_id` BIGINT NOT NULL COMMENT 'SKU ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `selected` TINYINT NOT NULL DEFAULT 1 COMMENT '是否选中:0否 1是',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sku` (`user_id`, `sku_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- 收藏表
CREATE TABLE `favorite` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品收藏表';

-- ============================================================
-- 4. 订单模块
-- ============================================================

-- 订单主表
CREATE TABLE `order` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `shop_id` BIGINT NOT NULL COMMENT '店铺ID',
  `total_amount` DECIMAL(12,2) NOT NULL COMMENT '订单总金额',
  `pay_amount` DECIMAL(12,2) NOT NULL COMMENT '实付金额',
  `freight_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '运费',
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '优惠金额',
  `coupon_id` BIGINT DEFAULT NULL COMMENT '优惠券ID',
  `pay_deadline` DATETIME DEFAULT NULL COMMENT '支付截止时间',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0待付款 1待发货 2待收货 3已完成 4已取消 5已退款',
  `receiver_name` VARCHAR(50) NOT NULL COMMENT '收货人',
  `receiver_phone` VARCHAR(20) NOT NULL COMMENT '收货电话',
  `receiver_address` VARCHAR(300) NOT NULL COMMENT '收货地址',
  `pay_type` TINYINT DEFAULT NULL COMMENT '支付方式:1支付宝 2微信 3银行卡',
  `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
  `delivery_time` DATETIME DEFAULT NULL COMMENT '发货时间',
  `receive_time` DATETIME DEFAULT NULL COMMENT '收货时间',
  `cancel_time` DATETIME DEFAULT NULL COMMENT '取消时间',
  `cancel_reason` VARCHAR(200) DEFAULT NULL COMMENT '取消原因',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '订单备注',
  `logistics_no` VARCHAR(100) DEFAULT NULL COMMENT '物流单号',
  `logistics_company` VARCHAR(50) DEFAULT NULL COMMENT '物流公司',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_shop_id` (`shop_id`),
  KEY `idx_status` (`status`),
  KEY `idx_status_pay_deadline` (`status`, `pay_deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

-- 订单商品明细表
CREATE TABLE `order_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `sku_id` BIGINT NOT NULL COMMENT 'SKU ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `product_name` VARCHAR(200) NOT NULL COMMENT '商品名称(冗余)',
  `sku_name` VARCHAR(200) NOT NULL COMMENT 'SKU名称(冗余)',
  `sku_image` VARCHAR(500) DEFAULT NULL COMMENT 'SKU图片(冗余)',
  `price` DECIMAL(10,2) NOT NULL COMMENT '单价',
  `quantity` INT NOT NULL COMMENT '数量',
  `total_amount` DECIMAL(12,2) NOT NULL COMMENT '小计金额',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_sku_id` (`sku_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品明细表';

-- 支付记录表
CREATE TABLE `payment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `payment_no` VARCHAR(50) NOT NULL COMMENT '支付流水号',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `user_id` BIGINT NOT NULL,
  `pay_type` TINYINT NOT NULL COMMENT '支付方式',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '支付金额',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0待支付 1支付成功 2支付失败 3已退款',
  `third_party_no` VARCHAR(100) DEFAULT NULL COMMENT '第三方支付流水号',
  `pay_time` DATETIME DEFAULT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- ============================================================
-- 5. 评价模块
-- ============================================================

CREATE TABLE `review` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `order_item_id` BIGINT NOT NULL COMMENT '订单明细ID',
  `product_id` BIGINT NOT NULL,
  `sku_id` BIGINT NOT NULL,
  `rating` TINYINT NOT NULL DEFAULT 5 COMMENT '评分:1-5',
  `content` VARCHAR(1000) DEFAULT NULL COMMENT '评价内容',
  `images` VARCHAR(1000) DEFAULT NULL COMMENT '评价图片(逗号分隔)',
  `is_anonymous` TINYINT NOT NULL DEFAULT 0 COMMENT '是否匿名',
  `reply` VARCHAR(500) DEFAULT NULL COMMENT '商家回复',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品评价表';

-- ============================================================
-- 6. 营销模块
-- ============================================================

-- 优惠券模板表
CREATE TABLE `coupon_template` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `shop_id` BIGINT DEFAULT NULL COMMENT '店铺ID,NULL为平台券',
  `name` VARCHAR(100) NOT NULL COMMENT '优惠券名称',
  `type` TINYINT NOT NULL COMMENT '类型:1满减 2折扣 3无门槛',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '优惠金额/折扣率',
  `min_amount` DECIMAL(10,2) DEFAULT NULL COMMENT '最低消费金额',
  `total_count` INT NOT NULL COMMENT '发放总量',
  `issued_count` INT NOT NULL DEFAULT 0 COMMENT '已领取数量',
  `used_count` INT NOT NULL DEFAULT 0 COMMENT '已使用数量',
  `start_time` DATETIME NOT NULL COMMENT '生效时间',
  `end_time` DATETIME NOT NULL COMMENT '失效时间',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1启用',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券模板表';

-- 用户领取优惠券记录表
CREATE TABLE `user_coupon` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `coupon_template_id` BIGINT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0未使用 1已使用 2已过期',
  `order_no` VARCHAR(50) DEFAULT NULL COMMENT '使用的订单号',
  `receive_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `use_time` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_coupon_template_id` (`coupon_template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券记录表';

-- ============================================================
-- 7. 初始数据
-- ============================================================

-- 管理员账号 (密码: admin123)
INSERT INTO `user` (`username`, `password`, `nickname`, `phone`, `role`, `status`)
VALUES ('admin', '$2a$10$kkfnOooScOlzdtwLxtOqB.oqo7XdSLl8o542lqGRDSb34cGFTi7Pm', '超级管理员', '13800000000', 2, 1);

-- 测试商家
INSERT INTO `user` (`username`, `password`, `nickname`, `phone`, `role`, `status`)
VALUES ('merchant', '$2a$10$kkfnOooScOlzdtwLxtOqB.oqo7XdSLl8o542lqGRDSb34cGFTi7Pm', '测试商家', '13800000001', 1, 1);

-- 测试用户
INSERT INTO `user` (`username`, `password`, `nickname`, `phone`, `role`, `status`)
VALUES ('testuser', '$2a$10$kkfnOooScOlzdtwLxtOqB.oqo7XdSLl8o542lqGRDSb34cGFTi7Pm', '测试用户', '13800000002', 0, 1);

-- 测试店铺
INSERT INTO `shop` (`user_id`, `shop_name`, `description`, `status`)
VALUES (2, '华为官方旗舰店', '华为官方授权店铺，正品保障', 1);

-- 商品分类(一级)
INSERT INTO `category` (`id`, `parent_id`, `name`, `level`, `sort_order`) VALUES
(1, 0, '手机数码', 1, 1),
(2, 0, '电脑办公', 1, 2),
(3, 0, '家用电器', 1, 3),
(4, 0, '服装鞋包', 1, 4);

-- 商品分类(二级)
INSERT INTO `category` (`id`, `parent_id`, `name`, `level`, `sort_order`) VALUES
(11, 1, '手机', 2, 1),
(12, 1, '耳机', 2, 2),
(13, 1, '智能手表', 2, 3),
(21, 2, '笔记本', 2, 1),
(22, 2, '台式机', 2, 2),
(31, 3, '冰箱', 2, 1),
(32, 3, '洗衣机', 2, 2);

-- 品牌
INSERT INTO `brand` (`id`, `name`, `description`, `sort_order`) VALUES
(1, '华为', '华为技术有限公司', 1),
(2, 'Apple', '苹果公司', 2),
(3, '小米', '小米科技有限公司', 3),
(4, '联想', '联想集团', 4);

-- 测试商品SPU
INSERT INTO `product` (`id`, `category_id`, `brand_id`, `shop_id`, `name`, `subtitle`, `status`, `sales_count`)
VALUES (1, 11, 1, 1, 'Huawei Mate 60 Pro', '麒麟芯片 | 鸿蒙系统 | 卫星通信', 1, 5000);

-- 测试SKU
INSERT INTO `sku` (`id`, `product_id`, `sku_name`, `spec_values`, `price`, `market_price`, `stock`, `status`) VALUES
(1, 1, 'Mate 60 Pro 雅丹黑 256GB', '{"颜色":"雅丹黑","内存":"256GB"}', 6999.00, 7999.00, 500, 1),
(2, 1, 'Mate 60 Pro 雅丹黑 512GB', '{"颜色":"雅丹黑","内存":"512GB"}', 7999.00, 8999.00, 300, 1),
(3, 1, 'Mate 60 Pro 白沙银 256GB', '{"颜色":"白沙银","内存":"256GB"}', 6999.00, 7999.00, 200, 1);
