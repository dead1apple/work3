SET NAMES utf8mb4;

-- 店铺位置字段：location 存经纬度（经度,纬度），address 存文字地址
ALTER TABLE `shop`
    ADD COLUMN `location` VARCHAR(64) DEFAULT NULL COMMENT '店铺经纬度（经度,纬度）' AFTER `rating`,
    ADD COLUMN `address` VARCHAR(255) DEFAULT NULL COMMENT '店铺地址文本' AFTER `location`;

-- 为现有演示店铺填充示例坐标（可在地图管理中修改）
UPDATE `shop` SET
    `location` = '116.397428,39.90923',
    `address` = '北京市东城区王府井大街 88 号'
WHERE `shop_name` = '华为官方旗舰店' AND (`location` IS NULL OR `location` = '');

UPDATE `shop` SET
    `location` = '121.473701,31.230416',
    `address` = '上海市黄浦区南京东路 99 号'
WHERE `shop_name` = 'Apple 官方旗舰' AND (`location` IS NULL OR `location` = '');

UPDATE `shop` SET
    `location` = '113.264385,23.129112',
    `address` = '广州市天河区天河路 385 号'
WHERE `shop_name` = '小米官方旗舰店' AND (`location` IS NULL OR `location` = '');

UPDATE `shop` SET
    `location` = '114.057868,22.543099',
    `address` = '深圳市福田区华强北路 1002 号'
WHERE `shop_name` = '商城自营' AND (`location` IS NULL OR `location` = '');
