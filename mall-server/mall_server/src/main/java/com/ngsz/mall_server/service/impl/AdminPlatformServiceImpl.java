package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.common.result.PageResult;
import com.ngsz.mall_server.pojo.dto.AdminBatchAuditRequest;
import com.ngsz.mall_server.pojo.dto.AdminCloseOrderRequest;
import com.ngsz.mall_server.pojo.dto.AdminDeliverRequest;
import com.ngsz.mall_server.pojo.dto.AdminRefundOrderRequest;
import com.ngsz.mall_server.service.AdminPlatformService;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminPlatformServiceImpl implements AdminPlatformService {

    private static final DateTimeFormatter REFUND_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
    private static final String DEFAULT_AUDIT_REJECT_REASON = "旧接口单项审核拒绝";
    private static final String DEFAULT_STATUS_MANAGEMENT_REASON = "旧接口单项状态管理";
    private static final int MAX_PAGE = 100_000;
    private static final long MAX_OFFSET = 20_000_000L;

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    @Autowired
    public AdminPlatformServiceImpl(JdbcTemplate jdbcTemplate) {
        this(jdbcTemplate, Clock.systemDefaultZone());
    }

    AdminPlatformServiceImpl(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Override
    public Map<String, Object> dashboard(Integer days) {
        int rangeDays = days == null ? 30 : days;
        if (rangeDays < 1 || rangeDays > 365) {
            throw new BusinessException("days 必须在 1 到 365 之间");
        }

        LocalDate today = LocalDate.now(clock);
        LocalDateTime start = today.minusDays(rangeDays - 1L).atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        Object[] metricArgs = {
                start, end, start, end, start, end, start, end, start, end
        };
        List<Map<String, Object>> metricRows = jdbcTemplate.queryForList("""
                SELECT
                  (SELECT COUNT(*) FROM user WHERE deleted = 0) AS userCount,
                  (SELECT COUNT(*) FROM user WHERE deleted = 0 AND status = 1) AS activeUserCount,
                  (SELECT COUNT(*) FROM product WHERE deleted = 0) AS productCount,
                  (SELECT COUNT(*) FROM product WHERE deleted = 0 AND status = 1) AS activeProductCount,
                  (SELECT COUNT(*) FROM `order` o WHERE o.deleted = 0
                      AND o.create_time >= ? AND o.create_time < ?) AS orderCount,
                  (SELECT COUNT(*) FROM `order` o WHERE o.deleted = 0
                      AND o.status IN (1, 2, 3)
                      AND o.create_time >= ? AND o.create_time < ?) AS paidOrderCount,
                  (SELECT COUNT(*) FROM shop) AS shopCount,
                  (SELECT COUNT(*) FROM shop WHERE status = 1) AS activeShopCount,
                  (SELECT COALESCE(SUM(o.pay_amount), 0) FROM `order` o
                      WHERE o.deleted = 0 AND o.status IN (1, 2, 3)
                      AND o.create_time >= ? AND o.create_time < ?) AS revenue,
                  COALESCE(ROUND(
                      (SELECT COUNT(*) FROM `order` o WHERE o.deleted = 0 AND o.status = 3
                          AND o.create_time >= ? AND o.create_time < ?) * 100.0 /
                      NULLIF((SELECT COUNT(*) FROM `order` o WHERE o.deleted = 0
                          AND o.status IN (1, 2, 3)
                          AND o.create_time >= ? AND o.create_time < ?), 0), 2), 0) AS completionRate,
                  COALESCE(ROUND(
                      (SELECT COALESCE(SUM(used_count), 0) FROM coupon_template) * 100.0 /
                      NULLIF((SELECT COALESCE(SUM(issued_count), 0) FROM coupon_template), 0), 2), 0)
                      AS couponUsageRate,
                  ((SELECT COUNT(*) FROM product WHERE deleted = 0 AND status = 2) +
                   (SELECT COUNT(*) FROM shop WHERE status = 0) +
                   (SELECT COUNT(*) FROM refund_record WHERE status = 0)) AS pendingAuditCount,
                  (SELECT COUNT(*) FROM product WHERE deleted = 0 AND status = 2) AS pendingProducts,
                  (SELECT COUNT(*) FROM shop WHERE status = 0) AS pendingShops,
                  (SELECT COUNT(*) FROM refund_record WHERE status = 0) AS pendingRefunds
                """, metricArgs);
        Map<String, Object> metricRow = metricRows.isEmpty() ? Map.of() : metricRows.get(0);

        Map<String, Object> metrics = new LinkedHashMap<>();
        copyLong(metricRow, metrics, "userCount");
        copyLong(metricRow, metrics, "activeUserCount");
        copyLong(metricRow, metrics, "productCount");
        copyLong(metricRow, metrics, "activeProductCount");
        copyLong(metricRow, metrics, "orderCount");
        copyLong(metricRow, metrics, "paidOrderCount");
        copyLong(metricRow, metrics, "shopCount");
        copyLong(metricRow, metrics, "activeShopCount");
        metrics.put("revenue", decimal(value(metricRow, "revenue")));
        metrics.put("completionRate", decimal(value(metricRow, "completionRate")));
        metrics.put("couponUsageRate", decimal(value(metricRow, "couponUsageRate")));
        copyLong(metricRow, metrics, "pendingAuditCount");

        List<Map<String, Object>> trendRows = jdbcTemplate.queryForList("""
                SELECT DATE_FORMAT(o.create_time, '%Y-%m-%d') AS date,
                       COALESCE(SUM(o.pay_amount), 0) AS revenue,
                       COUNT(*) AS orders
                FROM `order` o
                WHERE o.deleted = 0 AND o.status IN (1, 2, 3)
                  AND o.create_time >= ? AND o.create_time < ?
                GROUP BY DATE_FORMAT(o.create_time, '%Y-%m-%d')
                ORDER BY DATE_FORMAT(o.create_time, '%Y-%m-%d')
                """, new Object[]{start, end});
        Map<String, Map<String, Object>> trendByDate = new LinkedHashMap<>();
        for (Map<String, Object> row : trendRows) {
            trendByDate.put(dateKey(value(row, "date")), trendPoint(row));
        }
        List<Map<String, Object>> trend = new ArrayList<>(rangeDays);
        for (int index = 0; index < rangeDays; index++) {
            String date = today.minusDays(rangeDays - 1L - index).toString();
            trend.add(trendByDate.getOrDefault(date, row(
                    "date", date, "revenue", BigDecimal.ZERO, "orders", 0L)));
        }

        List<Map<String, Object>> orderStates = jdbcTemplate.queryForList("""
                SELECT status, COUNT(*) AS count
                FROM `order`
                WHERE deleted = 0
                GROUP BY status
                ORDER BY status
                """);
        List<Map<String, Object>> topProducts = jdbcTemplate.queryForList("""
                SELECT p.id, p.name, p.main_image AS image,
                       SUM(oi.quantity) AS value,
                       COALESCE(SUM(oi.total_amount), 0) AS secondary
                FROM order_item oi
                JOIN `order` o ON o.id = oi.order_id
                JOIN product p ON p.id = oi.product_id
                WHERE o.deleted = 0 AND p.deleted = 0
                  AND o.status IN (1, 2, 3)
                  AND o.create_time >= ? AND o.create_time < ?
                GROUP BY p.id, p.name, p.main_image
                ORDER BY value DESC, secondary DESC
                LIMIT 5
                """, new Object[]{start, end});
        List<Map<String, Object>> topShops = jdbcTemplate.queryForList("""
                SELECT s.id, s.shop_name AS name, s.logo AS image,
                       COALESCE(SUM(o.pay_amount), 0) AS value,
                       COUNT(*) AS secondary
                FROM `order` o
                JOIN shop s ON s.id = o.shop_id
                WHERE o.deleted = 0 AND o.status IN (1, 2, 3)
                  AND o.create_time >= ? AND o.create_time < ?
                GROUP BY s.id, s.shop_name, s.logo
                ORDER BY value DESC, secondary DESC
                LIMIT 5
                """, new Object[]{start, end});

        Map<String, Object> pending = row(
                "products", longValue(value(metricRow, "pendingProducts")),
                "shops", longValue(value(metricRow, "pendingShops")),
                "refunds", longValue(value(metricRow, "pendingRefunds")));
        return row(
                "days", rangeDays,
                "metrics", metrics,
                "trend", trend,
                "orderStates", orderStates,
                "topProducts", topProducts,
                "topShops", topShops,
                "pending", pending);
    }

    @Override
    public PageResult<Map<String, Object>> listAudits(
            String type, String keyword, Integer page, Integer size) {
        String normalizedType = auditType(type, true);
        PageBounds bounds = pageBounds(page, size);
        String like = normalizeKeyword(keyword);
        List<Object> args = new ArrayList<>();
        List<String> branches = new ArrayList<>();
        if (normalizedType == null || "product".equals(normalizedType)) {
            String product = """
                    SELECT p.id, 'product' AS type, p.name, p.main_image AS image,
                           u.username AS owner,
                           COALESCE(NULLIF(p.subtitle, ''), p.detail) AS description,
                           p.create_time AS createTime, p.status
                    FROM product p
                    JOIN shop s ON s.id = p.shop_id
                    JOIN user u ON u.id = s.user_id
                    WHERE p.deleted = 0 AND p.status = 2
                    """;
            if (like != null) {
                product += " AND (p.name LIKE ? OR u.username LIKE ?)";
                args.add(like);
                args.add(like);
            }
            branches.add(product);
        }
        if (normalizedType == null || "shop".equals(normalizedType)) {
            String shop = """
                    SELECT s.id, 'shop' AS type, s.shop_name AS name, s.logo AS image,
                           u.username AS owner, s.description,
                           s.create_time AS createTime, s.status
                    FROM shop s
                    JOIN user u ON u.id = s.user_id
                    WHERE s.status = 0
                    """;
            if (like != null) {
                shop += " AND (s.shop_name LIKE ? OR u.username LIKE ?)";
                args.add(like);
                args.add(like);
            }
            branches.add(shop);
        }
        String union = String.join(" UNION ALL ", branches);
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM (" + union + ") audit_queue",
                Long.class, args.toArray());
        List<Object> listArgs = new ArrayList<>(args);
        listArgs.add(bounds.size());
        listArgs.add(bounds.offset());
        List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM (" + union + ") audit_queue "
                        + "ORDER BY createTime DESC, id DESC, type ASC LIMIT ? OFFSET ?",
                listArgs.toArray());
        return new PageResult<>(total == null ? 0L : total, list, bounds.page(), bounds.size());
    }

    @Override
    public PageResult<Map<String, Object>> listAuditHistory(
            String type, Integer page, Integer size) {
        String normalizedType = auditType(type, true);
        PageBounds bounds = pageBounds(page, size);
        List<Object> args = new ArrayList<>();
        String where = "";
        if (normalizedType != null) {
            where = " WHERE target_type = ?";
            args.add(normalizedType);
        }
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM audit_record" + where, Long.class, args.toArray());
        args.add(bounds.size());
        args.add(bounds.offset());
        List<Map<String, Object>> list = jdbcTemplate.queryForList("""
                SELECT id, target_type AS bizType, target_id AS bizId,
                       target_name AS bizName, action, reason,
                       admin_name AS operatorName, create_time AS createTime
                FROM audit_record
                """ + where + " ORDER BY create_time DESC, id DESC LIMIT ? OFFSET ?", args.toArray());
        return new PageResult<>(total == null ? 0L : total, list, bounds.page(), bounds.size());
    }

    @Override
    @Transactional
    public void batchAudit(Long operatorId, AdminBatchAuditRequest request) {
        if (request == null) {
            throw new BusinessException("审核请求不能为空");
        }
        String type = auditType(request.getType(), false);
        String action = requiredText(request.getAction(), "审核动作不能为空");
        if (!"approve".equals(action) && !"reject".equals(action)) {
            throw new BusinessException("审核动作只能是 approve 或 reject");
        }
        String reason = trimToNull(request.getReason());
        if ("reject".equals(action) && reason == null) {
            throw new BusinessException("拒绝审核必须填写原因");
        }
        if (request.getIds() == null || request.getIds().isEmpty()) {
            throw new BusinessException("审核目标不能为空");
        }
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        for (Long id : request.getIds()) {
            if (id == null || id <= 0) {
                throw new BusinessException("审核目标 ID 无效");
            }
            ids.add(id);
        }

        String placeholders = placeholders(ids.size());
        boolean product = "product".equals(type);
        int pendingStatus = product ? 2 : 0;
        int afterStatus = "approve".equals(action) ? 1 : (product ? 0 : 3);
        String targetSql = product
                ? "SELECT id, name, status FROM product WHERE deleted = 0 AND id IN (" + placeholders + ")"
                : "SELECT id, user_id AS userId, shop_name AS name, status FROM shop WHERE id IN (" + placeholders + ")";
        List<Map<String, Object>> targets = jdbcTemplate.queryForList(targetSql, ids.toArray());
        Set<Long> returnedIds = new LinkedHashSet<>();
        boolean allPending = targets.size() == ids.size();
        for (Map<String, Object> target : targets) {
            returnedIds.add(longValue(value(target, "id")));
            allPending &= intValue(value(target, "status")) == pendingStatus;
        }
        if (!allPending || !returnedIds.equals(ids)) {
            throw new BusinessException("审核目标不存在或不在待审核状态");
        }

        String operatorName = operatorName(operatorId);
        String table = product ? "product" : "shop";
        String deletedGuard = product ? " AND deleted = 0" : "";
        String updateSql = "UPDATE " + table + " SET status = " + afterStatus
                + ", update_time = CURRENT_TIMESTAMP WHERE status = " + pendingStatus
                + deletedGuard + " AND id IN (" + placeholders + ")";
        int updated = jdbcTemplate.update(updateSql, ids.toArray());
        if (updated != ids.size()) {
            throw new BusinessException("审核目标状态已变化，请刷新后重试");
        }
        for (Map<String, Object> target : targets) {
            if (!product && afterStatus == 1 && value(target, "userId") != null) {
                jdbcTemplate.update("UPDATE user SET role = 1, update_time = CURRENT_TIMESTAMP "
                        + "WHERE id = ? AND deleted = 0", value(target, "userId"));
            }
            insertAuditRecord(type, longValue(value(target, "id")), value(target, "name"),
                    action, pendingStatus, afterStatus, reason, operatorId, operatorName);
        }
    }

    @Override
    @Transactional
    public void updateProductStatus(Long operatorId, Long id, Integer status) {
        if (id == null || id <= 0) {
            throw new BusinessException("商品 ID 无效");
        }
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException("商品状态只能是 0 或 1");
        }
        List<Map<String, Object>> products = jdbcTemplate.queryForList("""
                SELECT id, name, status
                FROM product
                WHERE id = ? AND deleted = 0
                FOR UPDATE
                """, id);
        if (products.isEmpty()) {
            throw new BusinessException("商品不存在");
        }
        Map<String, Object> product = products.get(0);
        int currentStatus = intValue(value(product, "status"));
        boolean auditTransition = currentStatus == 2;
        boolean listingTransition = (currentStatus == 1 && status == 0)
                || (currentStatus == 0 && status == 1);
        if (!auditTransition && !listingTransition) {
            throw new BusinessException(
                    "不允许商品状态从 " + currentStatus + " 变更为 " + status);
        }

        String operatorName = operatorName(operatorId);
        int updated = jdbcTemplate.update("""
                UPDATE product
                SET status = ?, update_time = CURRENT_TIMESTAMP
                WHERE id = ? AND status = ? AND deleted = 0
                """, new Object[]{status, id, currentStatus});
        if (updated != 1) {
            throw new BusinessException("商品状态已变化，请刷新后重试");
        }
        String action = auditTransition
                ? (status == 1 ? "approve" : "reject")
                : (status == 1 ? "enable" : "disable");
        String reason = auditTransition
                ? (status == 0 ? DEFAULT_AUDIT_REJECT_REASON : null)
                : DEFAULT_STATUS_MANAGEMENT_REASON;
        insertAuditRecord("product", id, value(product, "name"), action,
                currentStatus, status, reason, operatorId, operatorName);
    }

    @Override
    @Transactional
    public void updateShopStatus(Long operatorId, Long id, Integer status) {
        if (id == null || id <= 0) {
            throw new BusinessException("店铺 ID 无效");
        }
        if (status == null || (status != 1 && status != 2 && status != 3)) {
            throw new BusinessException("店铺状态只能是 1、2 或 3");
        }
        List<Map<String, Object>> shops = jdbcTemplate.queryForList("""
                SELECT id, user_id AS userId, shop_name AS name, status
                FROM shop
                WHERE id = ?
                FOR UPDATE
                """, id);
        if (shops.isEmpty()) {
            throw new BusinessException("店铺不存在");
        }
        Map<String, Object> shop = shops.get(0);
        int currentStatus = intValue(value(shop, "status"));
        boolean auditTransition = currentStatus == 0 && (status == 1 || status == 3);
        boolean managementTransition = (currentStatus == 1 && status == 2)
                || ((currentStatus == 2 || currentStatus == 3) && status == 1);
        if (!auditTransition && !managementTransition) {
            throw new BusinessException(
                    "不允许店铺状态从 " + currentStatus + " 变更为 " + status);
        }

        String operatorName = operatorName(operatorId);
        int updated = jdbcTemplate.update("""
                UPDATE shop
                SET status = ?, update_time = CURRENT_TIMESTAMP
                WHERE id = ? AND status = ?
                """, new Object[]{status, id, currentStatus});
        if (updated != 1) {
            throw new BusinessException("店铺状态已变化，请刷新后重试");
        }
        if (status == 1 && currentStatus == 0 && value(shop, "userId") != null) {
            jdbcTemplate.update("UPDATE user SET role = 1, update_time = CURRENT_TIMESTAMP "
                    + "WHERE id = ? AND deleted = 0", value(shop, "userId"));
        }
        String action = auditTransition
                ? (status == 1 ? "approve" : "reject")
                : (status == 1 ? "enable" : "disable");
        String reason = auditTransition
                ? (status == 3 ? DEFAULT_AUDIT_REJECT_REASON : null)
                : DEFAULT_STATUS_MANAGEMENT_REASON;
        insertAuditRecord("shop", id, value(shop, "name"), action,
                currentStatus, status, reason, operatorId, operatorName);
    }

    @Override
    public Map<String, Object> userDetail(Long id) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList("""
                SELECT id, username, nickname, phone, email, avatar, gender, status, role,
                       last_login_time AS lastLoginTime, last_login_ip AS lastLoginIp,
                       create_time AS createTime
                FROM user
                WHERE id = ? AND deleted = 0
                """, id);
        if (users.isEmpty()) {
            throw new BusinessException("用户不存在");
        }
        Map<String, Object> user = users.get(0);
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(orderSelect()
                + " WHERE o.user_id = ? AND o.deleted = 0 ORDER BY o.create_time DESC", id);
        List<Map<String, Object>> coupons = jdbcTemplate.queryForList("""
                SELECT ct.id, ct.shop_id AS shopId, ct.name, ct.type, ct.amount,
                       ct.min_amount AS minAmount, ct.total_count AS totalCount,
                       ct.issued_count AS issuedCount, ct.used_count AS usedCount,
                       ct.start_time AS startTime, ct.end_time AS endTime, ct.status,
                       ct.create_time AS createTime, uc.id AS userCouponId,
                       uc.status AS userStatus, uc.receive_time AS receiveTime
                FROM user_coupon uc
                JOIN coupon_template ct ON ct.id = uc.coupon_template_id
                WHERE uc.user_id = ?
                ORDER BY uc.receive_time DESC
                """, id);
        List<Map<String, Object>> addresses = jdbcTemplate.queryForList("""
                SELECT id, receiver_name AS receiverName, receiver_phone AS receiverPhone,
                       province, city, district, detail_address AS detailAddress,
                       is_default AS isDefault
                FROM user_address WHERE user_id = ?
                ORDER BY is_default DESC, id DESC
                """, id);
        List<Map<String, Object>> loginLogs = jdbcTemplate.queryForList("""
                SELECT id, user_id AS userId, username, ip, success, message,
                       create_time AS createTime
                FROM login_log
                WHERE user_id = ? OR username = ?
                ORDER BY create_time DESC
                LIMIT 100
                """, id, value(user, "username"));
        return row("user", user, "orders", orders, "coupons", coupons,
                "addresses", addresses, "loginLogs", loginLogs);
    }

    @Override
    public Map<String, Object> productDetail(Long id) {
        List<Map<String, Object>> products = jdbcTemplate.queryForList("""
                SELECT id, category_id AS categoryId, brand_id AS brandId, shop_id AS shopId,
                       name, subtitle, main_image AS mainImage, status,
                       sales_count AS salesCount, sort_order AS sortOrder,
                       create_time AS createTime
                FROM product WHERE id = ? AND deleted = 0
                """, id);
        if (products.isEmpty()) {
            throw new BusinessException("商品不存在");
        }
        List<Map<String, Object>> skuList = jdbcTemplate.queryForList("""
                SELECT id, sku_name AS skuName, sku_code AS skuCode, price,
                       market_price AS marketPrice, stock, locked_stock AS lockedStock, status
                FROM sku WHERE product_id = ? AND deleted = 0
                ORDER BY id
                """, id);
        return row("product", products.get(0), "skuList", skuList);
    }

    @Override
    public Map<String, Object> shopDetail(Long id) {
        List<Map<String, Object>> shops = jdbcTemplate.queryForList("""
                SELECT id, user_id AS userId, shop_name AS shopName, logo, description,
                       license_image AS licenseImage, status, rating,
                       create_time AS createTime
                FROM shop WHERE id = ?
                """, id);
        if (shops.isEmpty()) {
            throw new BusinessException("店铺不存在");
        }
        List<Map<String, Object>> flatProducts = jdbcTemplate.queryForList("""
                SELECT p.id, p.category_id AS categoryId, p.brand_id AS brandId,
                       p.shop_id AS shopId, p.name, p.subtitle, p.main_image AS mainImage,
                       p.status, p.sales_count AS salesCount, p.sort_order AS sortOrder,
                       p.create_time AS createTime,
                       COALESCE(MIN(s.price), 0) AS minPrice,
                       COALESCE(MAX(s.price), 0) AS maxPrice,
                       COALESCE(SUM(s.stock), 0) AS totalStock
                FROM product p
                LEFT JOIN sku s ON s.product_id = p.id AND s.deleted = 0
                WHERE p.shop_id = ? AND p.deleted = 0
                GROUP BY p.id, p.category_id, p.brand_id, p.shop_id, p.name, p.subtitle,
                         p.main_image, p.status, p.sales_count, p.sort_order, p.create_time
                ORDER BY p.create_time DESC
                """, id);
        List<Map<String, Object>> products = flatProducts.stream()
                .map(this::productSummary).toList();
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(orderSelect()
                + " WHERE o.shop_id = ? AND o.deleted = 0 ORDER BY o.create_time DESC", id);
        return row("shop", shops.get(0), "products", products, "orders", orders);
    }

    @Override
    public List<Map<String, Object>> listShopMapPoints() {
        return jdbcTemplate.queryForList("""
                SELECT id, shop_name AS shopName, location, address,
                       status, rating, logo
                FROM shop
                ORDER BY id
                """);
    }

    @Override
    public Map<String, Object> orderDetail(String orderNo) {
        String normalizedOrderNo = requiredText(orderNo, "订单号不能为空");
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(orderSelect()
                + " WHERE o.order_no = ? AND o.deleted = 0", normalizedOrderNo);
        if (orders.isEmpty()) {
            throw new BusinessException("订单不存在");
        }
        Map<String, Object> order = orders.get(0);
        List<Map<String, Object>> items = jdbcTemplate.queryForList("""
                SELECT id, product_name AS productName, sku_name AS skuName,
                       sku_image AS skuImage, price, quantity, total_amount AS totalAmount
                FROM order_item WHERE order_no = ? ORDER BY id
                """, normalizedOrderNo);
        List<Map<String, Object>> payments = jdbcTemplate.queryForList("""
                SELECT payment_no AS paymentNo, pay_type AS payType, amount, status,
                       third_party_no AS thirdPartyNo, pay_time AS payTime
                FROM payment WHERE order_no = ? ORDER BY id DESC LIMIT 1
                """, normalizedOrderNo);
        List<Map<String, Object>> refunds = jdbcTemplate.queryForList("""
                SELECT id, order_no AS orderNo, amount, reason, status,
                       operator_name AS operatorName, create_time AS createTime
                FROM refund_record WHERE order_no = ? ORDER BY create_time, id
                """, normalizedOrderNo);
        return row(
                "order", order,
                "items", items,
                "payment", payments.isEmpty() ? null : payments.get(0),
                "refunds", refunds,
                "timeline", timeline(order, refunds));
    }

    @Override
    @Transactional
    public void deliverOrder(String orderNo, AdminDeliverRequest request) {
        if (request == null) {
            throw new BusinessException("发货信息不能为空");
        }
        String company = requiredText(request.getLogisticsCompany(), "物流公司不能为空");
        String logisticsNo = requiredText(request.getLogisticsNo(), "物流单号不能为空");
        Map<String, Object> order = lockedOrder(orderNo);
        if (intValue(value(order, "status")) != 1) {
            throw new BusinessException("只有待发货订单可以发货");
        }
        int updated = jdbcTemplate.update("""
                UPDATE `order`
                SET status = 2, logistics_company = ?, logistics_no = ?,
                    delivery_time = CURRENT_TIMESTAMP, update_time = CURRENT_TIMESTAMP
                WHERE id = ? AND status = 1
                """, new Object[]{company, logisticsNo, value(order, "id")});
        if (updated != 1) {
            throw new BusinessException("订单状态已变化，请刷新后重试");
        }
    }

    @Override
    @Transactional
    public void closeOrder(String orderNo, AdminCloseOrderRequest request) {
        if (request == null) {
            throw new BusinessException("关闭信息不能为空");
        }
        String reason = requiredText(request.getReason(), "关闭原因不能为空");
        Map<String, Object> order = lockedOrder(orderNo);
        int status = intValue(value(order, "status"));
        if (status != 0) {
            throw new BusinessException("只有待付款订单可以关闭，已支付订单请走退款流程");
        }
        if (status == 0) {
            jdbcTemplate.update("""
                    UPDATE sku s
                    JOIN (
                        SELECT sku_id, SUM(quantity) AS quantity
                        FROM order_item
                        WHERE order_id = ?
                        GROUP BY sku_id
                    ) oi ON oi.sku_id = s.id
                    SET s.locked_stock = GREATEST(0, s.locked_stock - oi.quantity),
                        s.update_time = CURRENT_TIMESTAMP
                    """, new Object[]{value(order, "id")});
            jdbcTemplate.update("""
                    UPDATE payment
                    SET status = 4, update_time = CURRENT_TIMESTAMP
                    WHERE order_no = ? AND status = 0
                    """, new Object[]{value(order, "orderNo")});
        }
        int updated = jdbcTemplate.update("""
                UPDATE `order`
                SET status = 4, cancel_time = CURRENT_TIMESTAMP, cancel_reason = ?,
                    update_time = CURRENT_TIMESTAMP
                WHERE id = ? AND status = ?
                """, new Object[]{reason, value(order, "id"), status});
        if (updated != 1) {
            throw new BusinessException("订单状态已变化，请刷新后重试");
        }
    }

    @Override
    @Transactional
    public void refundOrder(
            Long operatorId, String orderNo, AdminRefundOrderRequest request) {
        if (request == null || request.getAmount() == null
                || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("退款金额必须大于 0");
        }
        BigDecimal amount = request.getAmount();
        if (amount.scale() > 2) {
            throw new BusinessException("退款金额最多保留两位小数");
        }
        String reason = requiredText(request.getReason(), "退款原因不能为空");
        Map<String, Object> order = lockedOrder(orderNo);
        int status = intValue(value(order, "status"));
        if (status != 1 && status != 2 && status != 3) {
            throw new BusinessException("当前订单状态不允许退款");
        }
        Long orderId = longValue(value(order, "id"));
        BigDecimal payAmount = decimal(value(order, "payAmount"));
        BigDecimal refunded = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(amount), 0)
                FROM refund_record
                WHERE order_id = ? AND status IN (0, 1)
                """, BigDecimal.class, orderId);
        refunded = refunded == null ? BigDecimal.ZERO : refunded;
        BigDecimal totalRefunded = refunded.add(amount);
        if (totalRefunded.compareTo(payAmount) > 0) {
            throw new BusinessException("退款金额超过剩余可退金额");
        }

        String operatorName = operatorName(operatorId);
        String refundNo = "RF" + LocalDateTime.now(clock).format(REFUND_TIME)
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        jdbcTemplate.update("""
                INSERT INTO refund_record
                  (refund_no, order_id, order_no, user_id, amount, reason, status,
                   operator_id, operator_name, create_time, update_time)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, new Object[]{refundNo, orderId, value(order, "orderNo"),
                value(order, "userId"), amount, reason, operatorId, operatorName});

        if (totalRefunded.compareTo(payAmount) == 0) {
            jdbcTemplate.update("""
                    UPDATE `order`
                    SET status = 5, cancel_time = CURRENT_TIMESTAMP,
                        cancel_reason = ?, update_time = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """, new Object[]{"全额退款: " + reason, orderId});
            jdbcTemplate.update("""
                    UPDATE payment SET status = 3, update_time = CURRENT_TIMESTAMP
                    WHERE order_no = ?
                    """, new Object[]{value(order, "orderNo")});
        }
    }

    private Map<String, Object> lockedOrder(String orderNo) {
        String normalizedOrderNo = requiredText(orderNo, "订单号不能为空");
        List<Map<String, Object>> orders = jdbcTemplate.queryForList("""
                SELECT id, order_no AS orderNo, user_id AS userId,
                       pay_amount AS payAmount, status
                FROM `order`
                WHERE order_no = ? AND deleted = 0
                FOR UPDATE
                """, normalizedOrderNo);
        if (orders.isEmpty()) {
            throw new BusinessException("订单不存在");
        }
        return orders.get(0);
    }

    private String operatorName(Long operatorId) {
        if (operatorId == null) {
            throw new BusinessException("管理员身份无效");
        }
        try {
            String username = jdbcTemplate.queryForObject("""
                    SELECT username FROM user
                    WHERE id = ? AND role = 2 AND deleted = 0
                    """, String.class, operatorId);
            if (username == null || username.isBlank()) {
                throw new BusinessException("管理员账号不存在");
            }
            return username;
        } catch (EmptyResultDataAccessException exception) {
            throw new BusinessException("管理员账号不存在");
        }
    }

    private void insertAuditRecord(
            String type, Long targetId, Object targetName, String action,
            int beforeStatus, int afterStatus, String reason,
            Long operatorId, String operatorName) {
        jdbcTemplate.update("""
                INSERT INTO audit_record
                  (target_type, target_id, target_name, action, before_status,
                   after_status, reason, admin_user_id, admin_name, create_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, new Object[]{
                type, targetId, targetName, action,
                Integer.toString(beforeStatus), Integer.toString(afterStatus), reason,
                operatorId, operatorName
        });
    }

    private List<Map<String, Object>> timeline(
            Map<String, Object> order, List<Map<String, Object>> refunds) {
        List<TimelineNode> nodes = new ArrayList<>();
        addTimeline(nodes, "created", "订单创建", value(order, "createTime"));
        addTimeline(nodes, "paid", "支付完成", value(order, "payTime"));
        addTimeline(nodes, "delivered", "订单发货", value(order, "deliveryTime"));
        addTimeline(nodes, "received", "确认收货", value(order, "receiveTime"));
        addTimeline(nodes, "cancelled", "订单关闭", value(order, "cancelTime"));
        for (Map<String, Object> refund : refunds) {
            String label = switch (intValue(value(refund, "status"))) {
                case 0 -> "退款处理中";
                case 1 -> "退款完成";
                case 2 -> "退款失败";
                default -> "退款状态更新";
            };
            addTimeline(nodes, "refunded", label, value(refund, "createTime"));
        }
        return nodes.stream()
                .sorted(Comparator.comparing(TimelineNode::sortTime))
                .map(node -> row("event", node.event(), "label", node.label(), "time", node.time()))
                .toList();
    }

    private static void addTimeline(
            List<TimelineNode> nodes, String event, String label, Object time) {
        if (time != null) {
            nodes.add(new TimelineNode(event, label, time, localDateTime(time)));
        }
    }

    private Map<String, Object> productSummary(Map<String, Object> flat) {
        Map<String, Object> product = new LinkedHashMap<>();
        for (String key : List.of("id", "categoryId", "brandId", "shopId", "name",
                "subtitle", "mainImage", "status", "salesCount", "sortOrder", "createTime")) {
            product.put(key, value(flat, key));
        }
        return row("product", product,
                "minPrice", decimal(value(flat, "minPrice")),
                "maxPrice", decimal(value(flat, "maxPrice")),
                "totalStock", longValue(value(flat, "totalStock")));
    }

    private static String orderSelect() {
        return """
                SELECT o.id, o.order_no AS orderNo, o.user_id AS userId,
                       o.shop_id AS shopId, o.total_amount AS totalAmount,
                       o.pay_amount AS payAmount, o.freight_amount AS freightAmount,
                       o.discount_amount AS discountAmount, o.status,
                       o.receiver_name AS receiverName, o.receiver_phone AS receiverPhone,
                       o.receiver_address AS receiverAddress, o.pay_type AS payType,
                       o.pay_time AS payTime, o.delivery_time AS deliveryTime,
                       o.receive_time AS receiveTime, o.cancel_time AS cancelTime,
                       o.cancel_reason AS cancelReason, o.logistics_no AS logisticsNo,
                       o.logistics_company AS logisticsCompany, o.create_time AS createTime
                FROM `order` o
                """;
    }

    private static Map<String, Object> trendPoint(Map<String, Object> source) {
        return row(
                "date", dateKey(value(source, "date")),
                "revenue", decimal(value(source, "revenue")),
                "orders", longValue(value(source, "orders")));
    }

    private static String auditType(String type, boolean optional) {
        String normalized = trimToNull(type);
        if (normalized == null && optional) {
            return null;
        }
        if (!"product".equals(normalized) && !"shop".equals(normalized)) {
            throw new BusinessException("审核类型只能是 product 或 shop");
        }
        return normalized;
    }

    private static PageBounds pageBounds(Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 20 : Math.min(size, 200);
        long offset = ((long) safePage - 1L) * safeSize;
        if (safePage > MAX_PAGE || offset > MAX_OFFSET) {
            throw new BusinessException("页码过大");
        }
        return new PageBounds(safePage, safeSize, offset);
    }

    private static String placeholders(int count) {
        return String.join(",", java.util.Collections.nCopies(count, "?"));
    }

    private static String normalizeKeyword(String keyword) {
        String normalized = trimToNull(keyword);
        return normalized == null ? null : "%" + normalized + "%";
    }

    private static String requiredText(String text, String message) {
        String normalized = trimToNull(text);
        if (normalized == null) {
            throw new BusinessException(message);
        }
        return normalized;
    }

    private static String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private static Object value(Map<String, Object> row, String key) {
        if (row.containsKey(key)) {
            return row.get(key);
        }
        String snake = key.replaceAll("([A-Z])", "_$1").toLowerCase();
        return row.get(snake);
    }

    private static void copyLong(
            Map<String, Object> source, Map<String, Object> target, String key) {
        target.put(key, longValue(value(source, key)));
    }

    private static long longValue(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private static int intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(Objects.toString(value));
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value instanceof BigDecimal decimal
                ? decimal : new BigDecimal(value.toString());
    }

    private static String dateKey(Object value) {
        if (value instanceof LocalDate date) {
            return date.toString();
        }
        if (value instanceof Date date) {
            return date.toLocalDate().toString();
        }
        if (value instanceof LocalDateTime dateTime) {
            return dateTime.toLocalDate().toString();
        }
        String text = Objects.toString(value, "");
        return text.length() >= 10 ? text.substring(0, 10) : text;
    }

    private static LocalDateTime localDateTime(Object value) {
        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        String text = value.toString().replace('T', ' ');
        return LocalDateTime.parse(text, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private static Map<String, Object> row(Object... values) {
        Map<String, Object> row = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            row.put((String) values[index], values[index + 1]);
        }
        return row;
    }

    private record PageBounds(int page, int size, long offset) {
    }

    private record TimelineNode(
            String event, String label, Object time, LocalDateTime sortTime) {
    }
}
