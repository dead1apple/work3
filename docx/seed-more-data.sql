-- ============================================================
-- jd_mall 批量演示数据生成脚本
-- 目标：扩充用户/店铺/商品/SKU/订单/支付/评论/收藏/购物车/地址/优惠券等数据
-- 幂等思路：主数据（品牌/用户/店铺/商品/优惠券模板/地址/评论）按唯一键跳过；
--          订单、支付、收藏、购物车、用户券、登录日志直接追加。
-- 执行：mysql -uroot -pXXX jd_mall < seed-more-data.sql
-- ============================================================
SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS seed_more_data;
DELIMITER $$
CREATE PROCEDURE seed_more_data()
BEGIN
  -- 所有 DECLARE 必须位于 BEGIN 块开头
  DECLARE i INT DEFAULT 0;
  DECLARE k INT DEFAULT 0;
  DECLARE v_uid BIGINT;
  DECLARE v_shop_id BIGINT;
  DECLARE v_pid BIGINT;
  DECLARE v_sku BIGINT;
  DECLARE v_price DECIMAL(10,2);
  DECLARE v_qty INT;
  DECLARE v_total DECIMAL(12,2);
  DECLARE v_freight DECIMAL(10,2);
  DECLARE v_discount DECIMAL(10,2);
  DECLARE v_pay DECIMAL(12,2);
  DECLARE v_status INT;
  DECLARE v_pay_type INT;
  DECLARE v_date DATETIME;
  DECLARE v_receiver VARCHAR(50) DEFAULT NULL;
  DECLARE v_phone VARCHAR(20) DEFAULT NULL;
  DECLARE v_addr VARCHAR(300) DEFAULT NULL;
  DECLARE v_cat BIGINT;
  DECLARE v_brand BIGINT;
  DECLARE v_order_no VARCHAR(50);
  DECLARE v_seq INT DEFAULT 0;
  DECLARE v_sku_cnt INT DEFAULT 0;
  DECLARE v_item_id BIGINT;
  DECLARE v_oid BIGINT;
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_username VARCHAR(50);
  DECLARE v_shop_name VARCHAR(100);
  DECLARE v_desc VARCHAR(500);
  DECLARE v_loc VARCHAR(64);
  DECLARE v_addrtext VARCHAR(255);
  DECLARE v_prod_name VARCHAR(200);
  DECLARE v_price_in DECIMAL(10,2);
  DECLARE v_skuname VARCHAR(200);
  DECLARE v_pname VARCHAR(200);
  DECLARE v_coupon_id BIGINT;
  DECLARE v_user_id BIGINT;
  DECLARE v_shop BIGINT;

  DECLARE cur_shops CURSOR FOR SELECT username, shop_name, description, location, address FROM tmp_shops;
  DECLARE cur_products CURSOR FOR
    SELECT s.id, t.category_id, t.brand_id, t.name, t.price
    FROM tmp_products t JOIN shop s ON s.shop_name LIKE CONCAT(t.shop_key, '%');
  DECLARE cur_users CURSOR FOR SELECT id FROM user WHERE role = 0 AND status = 1 AND id > 8;
  DECLARE cur_items CURSOR FOR
    SELECT oi.id, oi.product_id, oi.sku_id, o.user_id
    FROM order_item oi JOIN `order` o ON o.id = oi.order_id
    WHERE o.status = 3 AND RAND() < 0.7;
  DECLARE cur_fav CURSOR FOR SELECT id FROM user WHERE role = 0 AND status = 1 AND id > 8;
  DECLARE cur_cart CURSOR FOR SELECT id FROM user WHERE role = 0 AND status = 1 AND id > 8;
  DECLARE cur_coupon CURSOR FOR SELECT id FROM user WHERE role = 0 AND status = 1 AND id > 8;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  -- 密码：BCrypt(123456)，与现有演示用户一致
  SET @pwd = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi';

  -- ============ 1. 补充品牌 ============
  INSERT IGNORE INTO brand (name, logo, description, sort_order, status) VALUES
    ('OPPO', 'https://picsum.photos/seed/oppo/200/200', 'OPPO 智能手机与影音设备', 1, 1),
    ('vivo', 'https://picsum.photos/seed/vivo/200/200', 'vivo 影像旗舰手机', 2, 1),
    ('荣耀', 'https://picsum.photos/seed/honor/200/200', '荣耀手机与生态产品', 3, 1),
    ('三星', 'https://picsum.photos/seed/samsung/200/200', '三星电子全品类', 4, 1),
    ('一加', 'https://picsum.photos/seed/oneplus/200/200', '一加旗舰手机与配件', 5, 1),
    ('索尼', 'https://picsum.photos/seed/sony/200/200', '索尼影音与数码', 6, 1),
    ('海尔', 'https://picsum.photos/seed/haier/200/200', '海尔智慧家电', 7, 1),
    ('李宁', 'https://picsum.photos/seed/lining/200/200', '李宁运动服饰', 8, 1),
    ('安踏', 'https://picsum.photos/seed/anta/200/200', '安踏运动装备', 9, 1);

  -- ============ 2. 新增普通用户（28 个） ============
  SET i = 0;
  WHILE i < 28 DO
    SET i = i + 1;
    IF NOT EXISTS (SELECT 1 FROM user WHERE username = CONCAT('user', 100 + i)) THEN
      INSERT INTO user (username, password, nickname, phone, email, avatar, gender, status, role, create_time)
      VALUES (
        CONCAT('user', 100 + i),
        @pwd,
        CONCAT('演示用户', 100 + i),
        CONCAT('139', LPAD(FLOOR(RAND() * 900000000) + 100000000, 9, '0')),
        CONCAT('user', 100 + i, '@mall.test'),
        CONCAT('https://picsum.photos/seed/user', 100 + i, '/200/200'),
        FLOOR(RAND() * 3),
        1, 0,
        DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 120) DAY)
      );
    END IF;
  END WHILE;

  -- ============ 3. 新增商家用户 + 对应店铺（10 家） ============
  DROP TEMPORARY TABLE IF EXISTS tmp_shops;
  CREATE TEMPORARY TABLE tmp_shops (
    username VARCHAR(50), shop_name VARCHAR(100), description VARCHAR(500),
    location VARCHAR(64), address VARCHAR(255)
  );
  INSERT INTO tmp_shops VALUES
    ('oppostore', 'OPPO 官方旗舰店', 'OPPO 官方授权店铺，影像旗舰与影音配件', '113.280637,23.125178', '广州市天河区体育西路 191 号'),
    ('vivostore', 'vivo 官方旗舰店', 'vivo 官方授权店铺，影像旗舰手机', '114.057868,22.543099', '深圳市福田区华强北路 1002 号'),
    ('honorstore', '荣耀官方旗舰店', '荣耀官方授权店铺，全能旗舰与生态产品', '116.397428,39.90923', '北京市东城区王府井大街 88 号'),
    ('samsungstore', '三星官方旗舰店', '三星电子官方授权店铺', '121.473701,31.230416', '上海市黄浦区南京东路 99 号'),
    ('oneplusstore', '一加官方旗舰店', '一加旗舰手机与配件官方店', '114.057868,22.543099', '深圳市南山区深南大道 9988 号'),
    ('sonystore', '索尼官方旗舰店', '索尼影音、数码与游戏设备官方店', '121.473701,31.230416', '上海市徐汇区淮海中路 999 号'),
    ('haiershop', '海尔官方旗舰店', '海尔智慧家电全品类官方店', '116.397428,39.90923', '北京市朝阳区建国路 93 号'),
    ('greestore', '格力官方旗舰店', '格力空调与生活电器官方店', '113.264385,23.129112', '广州市天河区天河路 385 号'),
    ('liningstore', '李宁官方旗舰店', '李宁运动服饰与装备官方店', '116.397428,39.90923', '北京市大兴区亦庄经济开发区科创五街 8 号'),
    ('antastore', '安踏官方旗舰店', '安踏运动装备官方店', '118.296893,26.074508', '福建省厦门市思明区莲前东路 168 号');

  SET v_done = 0;
  OPEN cur_shops;
  shop_loop: LOOP
    FETCH cur_shops INTO v_username, v_shop_name, v_desc, v_loc, v_addrtext;
    IF v_done = 1 THEN
      LEAVE shop_loop;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM user WHERE username = v_username) THEN
      INSERT INTO user (username, password, nickname, phone, email, avatar, gender, status, role, create_time)
      VALUES (v_username, @pwd, v_shop_name, CONCAT('138', LPAD(FLOOR(RAND() * 900000000) + 100000000, 9, '0')),
              CONCAT(v_username, '@mall.test'), CONCAT('https://picsum.photos/seed/', v_username, '/200/200'),
              1, 1, 1, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 150) DAY));
      SET v_uid = LAST_INSERT_ID();
    ELSE
      SELECT id INTO v_uid FROM user WHERE username = v_username;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM shop WHERE shop_name = v_shop_name) THEN
      INSERT INTO shop (user_id, shop_name, logo, description, license_image, status, rating, location, address, create_time)
      VALUES (v_uid, v_shop_name, CONCAT('https://picsum.photos/seed/', v_username, '/300/300'), v_desc,
              'https://picsum.photos/seed/license/600/400', 1,
              ROUND(4.3 + RAND() * 0.7, 1), v_loc, v_addrtext,
              DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 150) DAY));
    END IF;
  END LOOP;
  CLOSE cur_shops;
  DROP TEMPORARY TABLE tmp_shops;

  -- ============ 4. 新增商品 + SKU ============
  DROP TEMPORARY TABLE IF EXISTS tmp_products;
  CREATE TEMPORARY TABLE tmp_products (
    shop_key VARCHAR(30), category_id BIGINT, brand_id BIGINT, name VARCHAR(200), price DECIMAL(10,2)
  );
  INSERT INTO tmp_products VALUES
    ('OPPO', 11, (SELECT id FROM brand WHERE name='OPPO'), 'OPPO Find X8 Pro', 5999.00),
    ('OPPO', 11, (SELECT id FROM brand WHERE name='OPPO'), 'OPPO Reno13 Pro', 3999.00),
    ('OPPO', 12, (SELECT id FROM brand WHERE name='OPPO'), 'OPPO Enco X3 真无线降噪耳机', 899.00),
    ('OPPO', 23, (SELECT id FROM brand WHERE name='OPPO'), 'OPPO Pad 4 Pro 平板', 3299.00),
    ('OPPO', 13, (SELECT id FROM brand WHERE name='OPPO'), 'OPPO Watch X2 智能手表', 1999.00),
    ('OPPO', 12, (SELECT id FROM brand WHERE name='OPPO'), 'OPPO 65W 超级闪充套装', 199.00),
    ('vivo', 11, (SELECT id FROM brand WHERE name='vivo'), 'vivo X200 Pro', 5499.00),
    ('vivo', 11, (SELECT id FROM brand WHERE name='vivo'), 'vivo S20 Pro', 3299.00),
    ('vivo', 12, (SELECT id FROM brand WHERE name='vivo'), 'vivo TWS 4 降噪耳机', 599.00),
    ('vivo', 23, (SELECT id FROM brand WHERE name='vivo'), 'vivo Pad4 平板电脑', 2799.00),
    ('vivo', 13, (SELECT id FROM brand WHERE name='vivo'), 'vivo WATCH 4 智能手表', 1399.00),
    ('vivo', 11, (SELECT id FROM brand WHERE name='vivo'), 'vivo 80W 闪充数据线套装', 129.00),
    ('荣耀', 11, (SELECT id FROM brand WHERE name='荣耀'), '荣耀 Magic7 Pro', 5699.00),
    ('荣耀', 11, (SELECT id FROM brand WHERE name='荣耀'), '荣耀 300 Ultra', 4199.00),
    ('荣耀', 12, (SELECT id FROM brand WHERE name='荣耀'), '荣耀 Earbuds X7 耳机', 399.00),
    ('荣耀', 23, (SELECT id FROM brand WHERE name='荣耀'), '荣耀平板 V9', 2599.00),
    ('荣耀', 21, (SELECT id FROM brand WHERE name='荣耀'), '荣耀 MagicBook 14 笔记本', 5299.00),
    ('荣耀', 13, (SELECT id FROM brand WHERE name='荣耀'), '荣耀手环 9', 249.00),
    ('三星', 11, (SELECT id FROM brand WHERE name='三星'), '三星 Galaxy S25 Ultra', 9699.00),
    ('三星', 11, (SELECT id FROM brand WHERE name='三星'), '三星 Galaxy Z Fold6', 13999.00),
    ('三星', 12, (SELECT id FROM brand WHERE name='三星'), '三星 Galaxy Buds3 Pro', 1299.00),
    ('三星', 13, (SELECT id FROM brand WHERE name='三星'), '三星 Galaxy Watch7', 2599.00),
    ('三星', 23, (SELECT id FROM brand WHERE name='三星'), '三星 Galaxy Tab S10', 6999.00),
    ('三星', 22, (SELECT id FROM brand WHERE name='三星'), '三星 27 英寸 4K 显示器', 3299.00),
    ('一加', 11, (SELECT id FROM brand WHERE name='一加'), '一加 13', 4499.00),
    ('一加', 11, (SELECT id FROM brand WHERE name='一加'), '一加 Ace5 Pro', 3499.00),
    ('一加', 12, (SELECT id FROM brand WHERE name='一加'), '一加 Buds Pro3', 799.00),
    ('一加', 23, (SELECT id FROM brand WHERE name='一加'), '一加 Pad2 平板', 2999.00),
    ('一加', 13, (SELECT id FROM brand WHERE name='一加'), '一加 Watch 2', 1499.00),
    ('一加', 12, (SELECT id FROM brand WHERE name='一加'), '一加 100W 闪充套装', 179.00),
    ('索尼', 12, (SELECT id FROM brand WHERE name='索尼'), '索尼 WH-1000XM6 头戴降噪耳机', 2999.00),
    ('索尼', 12, (SELECT id FROM brand WHERE name='索尼'), '索尼 WF-1000XM6 真无线降噪耳机', 1899.00),
    ('索尼', 13, (SELECT id FROM brand WHERE name='索尼'), '索尼 Wena Watch 智能手表', 2499.00),
    ('索尼', 21, (SELECT id FROM brand WHERE name='索尼'), '索尼 VAIO SX14 轻薄本', 9999.00),
    ('索尼', 12, (SELECT id FROM brand WHERE name='索尼'), '索尼 PlayStation 5 光驱版', 4299.00),
    ('索尼', 11, (SELECT id FROM brand WHERE name='索尼'), '索尼 Xperia 1 VI 手机', 7999.00),
    ('海尔', 31, (SELECT id FROM brand WHERE name='海尔'), '海尔 501L 十字对开门冰箱', 4999.00),
    ('海尔', 32, (SELECT id FROM brand WHERE name='海尔'), '海尔 10kg 直驱变频洗衣机', 3299.00),
    ('海尔', 33, (SELECT id FROM brand WHERE name='海尔'), '海尔 1.5 匹新风空调', 2799.00),
    ('海尔', 31, (SELECT id FROM brand WHERE name='海尔'), '海尔 60L 电热水器', 1299.00),
    ('海尔', 31, (SELECT id FROM brand WHERE name='海尔'), '海尔 13 套嵌入式洗碗机', 3999.00),
    ('海尔', 33, (SELECT id FROM brand WHERE name='海尔'), '海尔 600L 对开门冰箱', 5999.00),
    ('格力', 33, (SELECT id FROM brand WHERE name='格力'), '格力 云佳 1.5 匹变频空调', 2699.00),
    ('格力', 33, (SELECT id FROM brand WHERE name='格力'), '格力 3 匹立式柜机空调', 6999.00),
    ('格力', 31, (SELECT id FROM brand WHERE name='格力'), '格力 325L 风冷无霜冰箱', 2499.00),
    ('格力', 32, (SELECT id FROM brand WHERE name='格力'), '格力 8kg 波轮洗衣机', 1499.00),
    ('格力', 33, (SELECT id FROM brand WHERE name='格力'), '格力 1.5 匹移动空调', 1999.00),
    ('李宁', 41, (SELECT id FROM brand WHERE name='李宁'), '李宁 跑步鞋 赤兔 7', 399.00),
    ('李宁', 41, (SELECT id FROM brand WHERE name='李宁'), '李宁 篮球鞋 驭帅 18', 899.00),
    ('李宁', 41, (SELECT id FROM brand WHERE name='李宁'), '李宁 运动卫衣 加绒款', 299.00),
    ('李宁', 41, (SELECT id FROM brand WHERE name='李宁'), '李宁 轻便跑鞋 超轻 21', 499.00),
    ('李宁', 41, (SELECT id FROM brand WHERE name='李宁'), '李宁 运动长裤 束脚款', 199.00),
    ('李宁', 41, (SELECT id FROM brand WHERE name='李宁'), '李宁 双肩背包 多功能', 259.00),
    ('安踏', 41, (SELECT id FROM brand WHERE name='安踏'), '安踏 缓震跑步鞋 C202 GT', 549.00),
    ('安踏', 41, (SELECT id FROM brand WHERE name='安踏'), '安踏 篮球鞋 KT 系列', 799.00),
    ('安踏', 41, (SELECT id FROM brand WHERE name='安踏'), '安踏 轻薄羽绒服', 599.00),
    ('安踏', 41, (SELECT id FROM brand WHERE name='安踏'), '安踏 综训鞋 运动鞋', 329.00),
    ('安踏', 41, (SELECT id FROM brand WHERE name='安踏'), '安踏 速干 T 恤', 129.00),
    ('安踏', 41, (SELECT id FROM brand WHERE name='安踏'), '安踏 户外防风夹克', 399.00);

  SET v_done = 0;
  OPEN cur_products;
  product_loop: LOOP
    FETCH cur_products INTO v_shop_id, v_cat, v_brand, v_prod_name, v_price_in;
    IF v_done = 1 THEN
      LEAVE product_loop;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM product WHERE shop_id = v_shop_id AND name = v_prod_name) THEN
      INSERT INTO product (category_id, brand_id, shop_id, name, subtitle, main_image, images, detail, status, sales_count, sort_order, create_time, update_time, deleted)
      VALUES (v_cat, v_brand, v_shop_id, v_prod_name, CONCAT('官方正品 · 全国联保 · ', v_prod_name),
              CONCAT('https://picsum.photos/seed/p', v_shop_id, '-', v_prod_name, '/600/600'),
              CONCAT('https://picsum.photos/seed/p', v_shop_id, '-', v_prod_name, '-1/600/600,https://picsum.photos/seed/p', v_shop_id, '-', v_prod_name, '-2/600/600'),
              CONCAT('<p>', v_prod_name, ' 官方正品行货，享受全国联保服务。七天无理由退货，三十天质量问题换新。</p>'),
              1, FLOOR(RAND() * 300), FLOOR(RAND() * 100),
              DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 120) DAY), NOW(), 0);
      SET v_pid = LAST_INSERT_ID();
      SET v_sku_cnt = 2 + FLOOR(RAND() * 2);
      SET k = 0;
      WHILE k < v_sku_cnt DO
        SET k = k + 1;
        INSERT INTO sku (product_id, sku_name, spec_values, price, market_price, stock, locked_stock, image, sku_code, weight, status, create_time, update_time, deleted)
        VALUES (v_pid,
                CONCAT(v_prod_name, ' 标准版-', k),
                CONCAT('{"版本":"标准版-', k, '"}'),
                v_price_in,
                ROUND(v_price_in * 1.15, 2),
                FLOOR(RAND() * 800) + 50, 0,
                CONCAT('https://picsum.photos/seed/sku', v_pid, '-', k, '/400/400'),
                CONCAT('SKU', v_pid, '-', k),
                ROUND(0.1 + RAND() * 2, 2),
                1, NOW(), NOW(), 0);
      END WHILE;
    END IF;
  END LOOP;
  CLOSE cur_products;
  DROP TEMPORARY TABLE tmp_products;

  -- ============ 5. 优惠券模板（平台 + 店铺券） ============
  INSERT INTO coupon_template (shop_id, name, type, amount, min_amount, total_count, issued_count, used_count, start_time, end_time, status, create_time)
  SELECT NULL, '平台满 200 减 30 券', 1, 30.00, 200.00, 20000, 0, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM coupon_template WHERE name = '平台满 200 减 30 券');
  INSERT INTO coupon_template (shop_id, name, type, amount, min_amount, total_count, issued_count, used_count, start_time, end_time, status, create_time)
  SELECT NULL, '平台无门槛 5 元券', 3, 5.00, 0.00, 50000, 0, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, NOW()
  WHERE NOT EXISTS (SELECT 1 FROM coupon_template WHERE name = '平台无门槛 5 元券');
  INSERT INTO coupon_template (shop_id, name, type, amount, min_amount, total_count, issued_count, used_count, start_time, end_time, status, create_time)
  SELECT s.id, CONCAT(s.shop_name, ' 满 500 减 50'), 1, 50.00, 500.00, 3000, 0, 0, '2026-06-01 00:00:00', '2026-12-31 23:59:59', 1, NOW()
  FROM shop s WHERE s.id > 4
  AND NOT EXISTS (SELECT 1 FROM coupon_template WHERE name = CONCAT(s.shop_name, ' 满 500 减 50'));

  -- ============ 6. 收货地址（新用户各 1~2 条） ============
  DROP TEMPORARY TABLE IF EXISTS tmp_cities;
  CREATE TEMPORARY TABLE tmp_cities (province VARCHAR(50), city VARCHAR(50), district VARCHAR(50), detail VARCHAR(100));
  INSERT INTO tmp_cities VALUES
    ('广东省','广州市','天河区','珠江新城兴民路 222 号'),
    ('广东省','深圳市','南山区','科技园深南大道 9988 号'),
    ('北京市','北京市','朝阳区','建国路 93 号万达广场'),
    ('上海市','上海市','黄浦区','南京东路 99 号'),
    ('浙江省','杭州市','西湖区','文三路 90 号'),
    ('四川省','成都市','武侯区','天府大道中段 666 号'),
    ('湖北省','武汉市','洪山区','珞喻路 100 号'),
    ('江苏省','南京市','鼓楼区','中山北路 55 号');

  SET v_done = 0;
  OPEN cur_users;
  addr_loop: LOOP
    FETCH cur_users INTO v_uid;
    IF v_done = 1 THEN
      LEAVE addr_loop;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM user_address WHERE user_id = v_uid) THEN
      SELECT province, city, district, detail INTO @pr, @ci, @di, @de FROM tmp_cities ORDER BY RAND() LIMIT 1;
      INSERT INTO user_address (user_id, receiver_name, receiver_phone, province, city, district, detail_address, is_default, create_time)
      VALUES (v_uid, CONCAT('收货人', v_uid), CONCAT('137', LPAD(FLOOR(RAND() * 900000000) + 100000000, 9, '0')), @pr, @ci, @di, @de, 1, NOW());
      IF RAND() > 0.5 THEN
        SELECT province, city, district, detail INTO @pr, @ci, @di, @de FROM tmp_cities ORDER BY RAND() LIMIT 1;
        INSERT INTO user_address (user_id, receiver_name, receiver_phone, province, city, district, detail_address, is_default, create_time)
        VALUES (v_uid, CONCAT('收货人', v_uid, '-2'), CONCAT('136', LPAD(FLOOR(RAND() * 900000000) + 100000000, 9, '0')), @pr, @ci, @di, @de, 0, NOW());
      END IF;
    END IF;
  END LOOP;
  CLOSE cur_users;
  DROP TEMPORARY TABLE tmp_cities;

  -- ============ 7. 订单 + 订单项 + 支付（90 单） ============
  SET i = 0;
  WHILE i < 90 DO
    SET i = i + 1;
    SET v_seq = v_seq + 1;
    SELECT id INTO v_user_id FROM user WHERE status = 1 AND id <> 1 ORDER BY RAND() LIMIT 1;
    SELECT id INTO v_shop_id FROM shop WHERE status = 1 ORDER BY RAND() LIMIT 1;
    SET v_total = 0;
    SELECT CONCAT(DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(1000 + v_seq, 4, '0')) INTO v_order_no;
    SET v_receiver = NULL;
    SET v_phone = NULL;
    SET v_addr = NULL;
    SELECT receiver_name, receiver_phone, CONCAT(province, city, district, detail_address)
      INTO v_receiver, v_phone, v_addr
      FROM user_address WHERE user_id = v_user_id ORDER BY is_default DESC LIMIT 1;
    IF v_receiver IS NULL THEN
      SET v_receiver = CONCAT('收货人', v_user_id);
      SET v_phone = CONCAT('135', LPAD(FLOOR(RAND() * 900000000) + 100000000, 9, '0'));
      SET v_addr = '北京市朝阳区建国路 93 号';
    END IF;
    SET v_status = FLOOR(RAND() * 100);
    SET v_status = CASE
      WHEN v_status < 12 THEN 0
      WHEN v_status < 34 THEN 1
      WHEN v_status < 60 THEN 2
      WHEN v_status < 90 THEN 3
      WHEN v_status < 95 THEN 4
      ELSE 5 END;
    SET v_date = DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY);
    SET v_pay_type = NULL;
    IF v_status IN (1,2,3,5) THEN
      SET v_pay_type = 1 + FLOOR(RAND() * 3);
    END IF;
    INSERT INTO `order` (order_no, user_id, shop_id, total_amount, pay_amount, freight_amount, discount_amount, coupon_id,
                         status, receiver_name, receiver_phone, receiver_address, pay_type, pay_time, delivery_time,
                         receive_time, cancel_time, cancel_reason, remark, logistics_no, logistics_company, create_time, update_time, deleted)
    VALUES (v_order_no, v_user_id, v_shop_id, 0, 0, 0, 0, NULL, v_status,
            v_receiver, v_phone, v_addr, v_pay_type, NULL, NULL, NULL, NULL, NULL, CONCAT('备注：演示订单 ', v_seq), NULL, NULL,
            v_date, v_date, 0);
    SET v_oid = LAST_INSERT_ID();

    DROP TEMPORARY TABLE IF EXISTS tmp_shop_skus;
    CREATE TEMPORARY TABLE tmp_shop_skus AS
      SELECT s.id AS sku_id, s.product_id AS product_id, p.name AS product_name, s.sku_name, s.price
      FROM sku s JOIN product p ON p.id = s.product_id
      WHERE p.shop_id = v_shop_id AND s.status = 1 AND s.deleted = 0;
    SET v_sku_cnt = 1 + FLOOR(RAND() * 3);
    SET k = 0;
    WHILE k < v_sku_cnt DO
      SET k = k + 1;
      SET v_sku = NULL;
      SELECT sku_id, product_id, product_name, sku_name, price INTO v_sku, v_pid, v_pname, v_skuname, v_price
      FROM tmp_shop_skus ORDER BY RAND() LIMIT 1;
      IF v_sku IS NOT NULL THEN
        SET v_qty = 1 + FLOOR(RAND() * 3);
        INSERT INTO order_item (order_id, order_no, sku_id, product_id, product_name, sku_name, sku_image, price, quantity, total_amount, create_time)
        VALUES (v_oid, v_order_no, v_sku, v_pid, v_pname, v_skuname,
                CONCAT('https://picsum.photos/seed/oi', v_oid, '-', k, '/300/300'),
                v_price, v_qty, ROUND(v_price * v_qty, 2), v_date);
        SET v_total = v_total + ROUND(v_price * v_qty, 2);
      END IF;
    END WHILE;
    DROP TEMPORARY TABLE tmp_shop_skus;

    SET v_freight = IF(v_total >= 99, 0, 10);
    SET v_discount = ROUND(v_total * (0.02 + RAND() * 0.06), 2);
    SET v_pay = ROUND(v_total + v_freight - v_discount, 2);
    IF v_pay < 0 THEN SET v_pay = v_total; END IF;
    UPDATE `order` SET total_amount = v_total, pay_amount = v_pay,
           freight_amount = v_freight, discount_amount = v_discount
    WHERE id = v_oid;

    IF v_status IN (1,2,3,5) THEN
      INSERT INTO payment (payment_no, order_no, user_id, pay_type, amount, status, third_party_no, pay_time, create_time, update_time)
      VALUES (CONCAT('PAY', v_order_no), v_order_no, v_user_id, v_pay_type, v_pay,
              IF(v_status = 5, 3, 1),
              CONCAT('TP', FLOOR(RAND() * 9000000000) + 1000000000),
              DATE_ADD(v_date, INTERVAL FLOOR(RAND() * 6) HOUR), v_date, NOW());
    END IF;

    IF v_status >= 1 THEN
      UPDATE `order` SET pay_time = DATE_ADD(v_date, INTERVAL FLOOR(RAND() * 6) HOUR) WHERE id = v_oid;
    END IF;
    IF v_status >= 2 THEN
      UPDATE `order` SET delivery_time = DATE_ADD(pay_time, INTERVAL 1 + FLOOR(RAND() * 24) HOUR) WHERE id = v_oid;
    END IF;
    IF v_status >= 3 THEN
      UPDATE `order` SET receive_time = DATE_ADD(delivery_time, INTERVAL 1 + FLOOR(RAND() * 72) HOUR) WHERE id = v_oid;
    END IF;
    IF v_status = 4 THEN
      UPDATE `order` SET cancel_time = DATE_ADD(v_date, INTERVAL FLOOR(RAND() * 12) HOUR),
             cancel_reason = '买家主动取消' WHERE id = v_oid;
    END IF;
    IF v_status = 5 THEN
      UPDATE `order` SET cancel_time = DATE_ADD(v_date, INTERVAL 1 + FLOOR(RAND() * 48) HOUR),
             cancel_reason = '申请退款成功' WHERE id = v_oid;
    END IF;
  END WHILE;

  -- ============ 8. 评论（已完成订单的部分订单项） ============
  SET v_done = 0;
  OPEN cur_items;
  review_loop: LOOP
    FETCH cur_items INTO v_item_id, v_pid, v_sku, v_user_id;
    IF v_done = 1 THEN
      LEAVE review_loop;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM review WHERE order_item_id = v_item_id) THEN
      INSERT INTO review (user_id, order_item_id, product_id, sku_id, rating, content, images, is_anonymous, reply, create_time)
      VALUES (v_user_id, v_item_id, v_pid, v_sku,
              4 + FLOOR(RAND() * 2),
              ELT(1 + FLOOR(RAND() * 5),
                  '商品质量很好，物流也快，非常满意！',
                  '包装完好，和描述一致，用了一段时间来评价，值得推荐。',
                  '性价比很高，客服态度也不错。',
                  '整体不错，就是发货稍微慢了一点，其他都挺好。',
                  '正品无疑，做工精细，下次还会回购。'),
              IF(RAND() > 0.7, 'https://picsum.photos/seed/rv1/400/400,https://picsum.photos/seed/rv2/400/400', NULL),
              IF(RAND() > 0.8, 1, 0),
              IF(RAND() > 0.6, '感谢您的支持，欢迎再次光临！', NULL),
              DATE_ADD((SELECT create_time FROM `order` WHERE id = (SELECT order_id FROM order_item WHERE id = v_item_id)), INTERVAL 1 + FLOOR(RAND() * 5) DAY));
    END IF;
  END LOOP;
  CLOSE cur_items;

  -- ============ 9. 收藏 ============
  SET v_done = 0;
  OPEN cur_fav;
  fav_loop: LOOP
    FETCH cur_fav INTO v_uid;
    IF v_done = 1 THEN
      LEAVE fav_loop;
    END IF;
    SET k = 0;
    WHILE k < 2 + FLOOR(RAND() * 4) DO
      SET k = k + 1;
      SELECT id INTO v_pid FROM product WHERE status = 1 ORDER BY RAND() LIMIT 1;
      IF NOT EXISTS (SELECT 1 FROM favorite WHERE user_id = v_uid AND product_id = v_pid) THEN
        INSERT INTO favorite (user_id, product_id, create_time)
        VALUES (v_uid, v_pid, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 60) DAY));
      END IF;
    END WHILE;
  END LOOP;
  CLOSE cur_fav;

  -- ============ 10. 购物车 ============
  SET v_done = 0;
  OPEN cur_cart;
  cart_loop: LOOP
    FETCH cur_cart INTO v_uid;
    IF v_done = 1 THEN
      LEAVE cart_loop;
    END IF;
    IF RAND() > 0.4 THEN
      SET k = 0;
      WHILE k < 1 + FLOOR(RAND() * 3) DO
        SET k = k + 1;
        SELECT id, product_id INTO v_sku, v_pid FROM sku WHERE status = 1 AND deleted = 0 ORDER BY RAND() LIMIT 1;
        IF NOT EXISTS (SELECT 1 FROM cart WHERE user_id = v_uid AND sku_id = v_sku) THEN
          INSERT INTO cart (user_id, sku_id, product_id, quantity, selected, create_time, update_time)
          VALUES (v_uid, v_sku, v_pid, 1 + FLOOR(RAND() * 3), 1, NOW(), NOW());
        END IF;
      END WHILE;
    END IF;
  END LOOP;
  CLOSE cur_cart;

  -- ============ 11. 用户优惠券 ============
  SET v_done = 0;
  OPEN cur_coupon;
  coupon_loop: LOOP
    FETCH cur_coupon INTO v_uid;
    IF v_done = 1 THEN
      LEAVE coupon_loop;
    END IF;
    SET k = 0;
    WHILE k < 1 + FLOOR(RAND() * 3) DO
      SET k = k + 1;
      SELECT id INTO v_coupon_id FROM coupon_template WHERE status = 1 ORDER BY RAND() LIMIT 1;
      IF NOT EXISTS (SELECT 1 FROM user_coupon WHERE user_id = v_uid AND coupon_template_id = v_coupon_id) THEN
        INSERT INTO user_coupon (user_id, coupon_template_id, status, order_no, receive_time, use_time)
        VALUES (v_uid, v_coupon_id, IF(RAND() > 0.7, 1, 0), NULL,
                DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY), NULL);
      END IF;
    END WHILE;
  END LOOP;
  CLOSE cur_coupon;

  -- ============ 12. 登录日志 ============
  INSERT INTO login_log (user_id, username, ip, success, message, create_time)
  SELECT u.id, u.username,
         CONCAT('58.', FLOOR(RAND() * 200) + 1, '.', FLOOR(RAND() * 254) + 1, '.', FLOOR(RAND() * 254) + 1),
         1, '登录成功',
         DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 45) DAY)
  FROM user u WHERE u.id > 3
  ORDER BY RAND() LIMIT 120;

  -- ============ 13. 同步商品销量与优惠券统计 ============
  UPDATE product p
  SET sales_count = (SELECT COALESCE(SUM(oi.quantity), 0)
                     FROM order_item oi JOIN `order` o ON o.id = oi.order_id
                     WHERE oi.product_id = p.id AND o.status IN (1,2,3,5));
  UPDATE coupon_template ct
  SET issued_count = (SELECT COUNT(*) FROM user_coupon WHERE coupon_template_id = ct.id),
      used_count = (SELECT COUNT(*) FROM user_coupon WHERE coupon_template_id = ct.id AND status = 1);

END$$
DELIMITER ;

CALL seed_more_data();
DROP PROCEDURE IF EXISTS seed_more_data;
