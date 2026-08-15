SET NAMES utf8mb4;

-- 将店铺点位重新分布到全国各地：每家店铺一个独立城市，
-- 覆盖东北、西北、西南、华中、华北、华东、华南各区域

UPDATE `shop` SET `location` = '116.397428,39.90923', `address` = '北京市东城区王府井大街 88 号' WHERE `id` = 1;    -- 华为官方旗舰店 -> 北京（华北）
UPDATE `shop` SET `location` = '121.473701,31.230416', `address` = '上海市黄浦区南京东路 99 号' WHERE `id` = 2;    -- Apple 官方旗舰 -> 上海（华东）
UPDATE `shop` SET `location` = '113.264385,23.129112', `address` = '广州市天河区天河路 385 号' WHERE `id` = 3;    -- 小米官方旗舰店 -> 广州（华南）
UPDATE `shop` SET `location` = '114.057868,22.543099', `address` = '深圳市福田区华强北路 1002 号' WHERE `id` = 4; -- 商城自营 -> 深圳（华南）
UPDATE `shop` SET `location` = '104.066513,30.572269', `address` = '成都市锦江区春熙路 89 号' WHERE `id` = 5;    -- OPPO -> 成都（西南）
UPDATE `shop` SET `location` = '106.530635,29.544606', `address` = '重庆市渝中区解放碑步行街 1 号' WHERE `id` = 6; -- vivo -> 重庆（西南）
UPDATE `shop` SET `location` = '108.93977,34.341574', `address` = '西安市碑林区南大街 12 号' WHERE `id` = 7;     -- 荣耀 -> 西安（西北）
UPDATE `shop` SET `location` = '114.305469,30.593099', `address` = '武汉市江汉区中山大道 668 号' WHERE `id` = 8;  -- 三星 -> 武汉（华中）
UPDATE `shop` SET `location` = '126.534967,45.803775', `address` = '哈尔滨市南岗区果戈里大街 12 号' WHERE `id` = 9; -- 一加 -> 哈尔滨（东北）
UPDATE `shop` SET `location` = '87.617733,43.792818', `address` = '乌鲁木齐市天山区解放北路 66 号' WHERE `id` = 10; -- 索尼 -> 乌鲁木齐（西北）
UPDATE `shop` SET `location` = '102.714601,25.049153', `address` = '昆明市五华区东风西路 33 号' WHERE `id` = 11; -- 海尔 -> 昆明（西南）
UPDATE `shop` SET `location` = '112.938846,28.228209', `address` = '长沙市芙蓉区五一大道 368 号' WHERE `id` = 12; -- 格力 -> 长沙（华中）
UPDATE `shop` SET `location` = '113.625368,34.746611', `address` = '郑州市二七区二七路 89 号' WHERE `id` = 13;  -- 李宁 -> 郑州（华中）
UPDATE `shop` SET `location` = '110.199891,20.044412', `address` = '海口市龙华区海秀中路 55 号' WHERE `id` = 14; -- 安踏 -> 海口（华南）
