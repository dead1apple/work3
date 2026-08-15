package com.ngsz.mall_server.service.impl;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.pojo.dto.AdminBatchAuditRequest;
import com.ngsz.mall_server.pojo.dto.AdminCloseOrderRequest;
import com.ngsz.mall_server.pojo.dto.AdminDeliverRequest;
import com.ngsz.mall_server.pojo.dto.AdminRefundOrderRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminPlatformServiceImplTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private AdminPlatformServiceImpl service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(
                Instant.parse("2026-08-14T04:00:00Z"), ZoneId.of("Asia/Shanghai"));
        service = new AdminPlatformServiceImpl(jdbcTemplate, clock);
    }

    @Test
    void dashboardCountsOnlyPaidStatesAsRevenueAndFillsMissingDates() {
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            if (sql.contains("AS userCount")) {
                return List.of(row(
                        "userCount", 10L, "activeUserCount", 8L,
                        "productCount", 20L, "activeProductCount", 15L,
                        "orderCount", 4L, "paidOrderCount", 3L,
                        "shopCount", 5L, "activeShopCount", 4L,
                        "revenue", new BigDecimal("150.50"),
                        "completionRate", new BigDecimal("33.33"),
                        "couponUsageRate", new BigDecimal("25.00"),
                        "pendingAuditCount", 6L,
                        "pendingProducts", 2L, "pendingShops", 3L, "pendingRefunds", 1L));
            }
            if (sql.contains("AS date") && sql.contains("COUNT(*) AS orders")) {
                return List.of(
                        row("date", "2026-08-12", "revenue", new BigDecimal("50.00"), "orders", 1L),
                        row("date", "2026-08-14", "revenue", new BigDecimal("100.50"), "orders", 2L));
            }
            return List.of();
        });
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of());

        Map<String, Object> dashboard = service.dashboard(3);

        Map<?, ?> metrics = (Map<?, ?>) dashboard.get("metrics");
        assertThat(metrics.get("revenue")).isEqualTo(new BigDecimal("150.50"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> trend = (List<Map<String, Object>>) dashboard.get("trend");
        assertThat(trend).containsExactly(
                row("date", "2026-08-12", "revenue", new BigDecimal("50.00"), "orders", 1L),
                row("date", "2026-08-13", "revenue", BigDecimal.ZERO, "orders", 0L),
                row("date", "2026-08-14", "revenue", new BigDecimal("100.50"), "orders", 2L));

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, org.mockito.Mockito.atLeast(2))
                .queryForList(sql.capture(), any(Object[].class));
        assertThat(sql.getAllValues().stream()
                .filter(value -> value.contains("SUM") || value.contains("GROUP BY DATE")))
                .allSatisfy(value -> assertThat(value).contains("o.status IN (1, 2, 3)"));
        String trendSql = sql.getAllValues().stream()
                .filter(value -> value.contains("GROUP BY"))
                .findFirst()
                .orElseThrow();
        String selectDateExpression = clauseExpression(trendSql, "SELECT ", " AS date");
        String groupDateExpression = clauseExpression(trendSql, "GROUP BY ", "\n");
        assertThat(trendSql)
                .contains("SELECT DATE_FORMAT(o.create_time, '%Y-%m-%d') AS date")
                .contains("GROUP BY DATE_FORMAT(o.create_time, '%Y-%m-%d')")
                .contains("ORDER BY DATE_FORMAT(o.create_time, '%Y-%m-%d')")
                .doesNotContain("DATE_FORMAT(DATE(o.create_time)");
        assertThat(groupDateExpression).isEqualTo(selectDateExpression);
    }

    @Test
    void dashboardRejectsDaysOutsideOneTo365BeforeQuerying() {
        assertThatThrownBy(() -> service.dashboard(0))
                .isInstanceOf(BusinessException.class)
                .hasMessage("days 必须在 1 到 365 之间");
        assertThatThrownBy(() -> service.dashboard(366))
                .isInstanceOf(BusinessException.class)
                .hasMessage("days 必须在 1 到 365 之间");

        verify(jdbcTemplate, never()).queryForList(anyString());
        verify(jdbcTemplate, never()).queryForList(anyString(), any(Object[].class));
    }

    @Test
    void rejectAuditRequiresReasonBeforeDatabaseAccess() {
        AdminBatchAuditRequest request = auditRequest("product", List.of(1L), "reject", "  ");

        assertThatThrownBy(() -> service.batchAudit(7L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("拒绝审核必须填写原因");

        verify(jdbcTemplate, never()).queryForList(anyString(), any(Object[].class));
    }

    @Test
    void invalidBatchTargetCausesNoPartialWrite() {
        AdminBatchAuditRequest request = auditRequest(
                "product", List.of(1L, 1L, 2L, 99L), "approve", null);
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class)))
                .thenReturn(List.of(
                        row("id", 1L, "name", "待审商品", "status", 2),
                        row("id", 2L, "name", "已上架商品", "status", 1)));

        assertThatThrownBy(() -> service.batchAudit(7L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("审核目标不存在或不在待审核状态");

        verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void validBatchUpdatesAllTargetsAndWritesOneAuditRecordPerItem() {
        AdminBatchAuditRequest request = auditRequest(
                "shop", List.of(5L, 5L, 6L), "reject", "资质不完整");
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class)))
                .thenReturn(List.of(
                        row("id", 5L, "name", "店铺甲", "status", 0),
                        row("id", 6L, "name", "店铺乙", "status", 0)));
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq(7L)))
                .thenReturn("admin");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            return sql.contains("UPDATE shop") ? 2 : 1;
        });

        service.batchAudit(7L, request);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, org.mockito.Mockito.times(3))
                .update(sql.capture(), any(Object[].class));
        assertThat(sql.getAllValues().get(0)).contains("UPDATE shop").contains("status = 3");
        assertThat(sql.getAllValues().subList(1, 3))
                .allSatisfy(value -> assertThat(value).contains("INSERT INTO audit_record"));
    }

    @Test
    void pendingProductApproveUpdatesStatusAndWritesApproveAudit() {
        when(jdbcTemplate.queryForList(anyString(), eq(8L)))
                .thenReturn(List.of(row("id", 8L, "name", "待审商品", "status", 2)));
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq(7L)))
                .thenReturn("admin");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        service.updateProductStatus(7L, 8L, 1);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> args = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate, org.mockito.Mockito.times(2)).update(sql.capture(), args.capture());
        assertThat(sql.getAllValues().get(0)).contains("UPDATE product");
        assertThat(args.getAllValues().get(0)).containsExactly(1, 8L, 2);
        assertThat(sql.getAllValues().get(1)).contains("INSERT INTO audit_record");
        assertThat(args.getAllValues().get(1)).containsExactly(
                "product", 8L, "待审商品", "approve", "2", "1", null, 7L, "admin");
    }

    @Test
    void pendingProductRejectUsesDefaultReasonAndWritesRejectAudit() {
        when(jdbcTemplate.queryForList(anyString(), eq(8L)))
                .thenReturn(List.of(row("id", 8L, "name", "待审商品", "status", 2)));
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq(7L)))
                .thenReturn("admin");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        service.updateProductStatus(7L, 8L, 0);

        ArgumentCaptor<Object[]> args = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate, org.mockito.Mockito.times(2))
                .update(anyString(), args.capture());
        assertThat(args.getAllValues().get(1)).containsExactly(
                "product", 8L, "待审商品", "reject", "2", "0",
                "旧接口单项审核拒绝", 7L, "admin");
        assertThat(args.getAllValues().get(1)[6].toString()).isNotBlank();
    }

    @Test
    void productListingManagementWritesDisableAndEnableAuditRecords() {
        when(jdbcTemplate.queryForList(anyString(), eq(9L)))
                .thenReturn(List.of(row("id", 9L, "name", "在售商品", "status", 1)));
        when(jdbcTemplate.queryForList(anyString(), eq(10L)))
                .thenReturn(List.of(row("id", 10L, "name", "下架商品", "status", 0)));
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq(7L)))
                .thenReturn("admin");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        service.updateProductStatus(7L, 9L, 0);
        service.updateProductStatus(7L, 10L, 1);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> args = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate, org.mockito.Mockito.times(4))
                .update(sql.capture(), args.capture());
        assertThat(sql.getAllValues().stream()
                .filter(value -> value.contains("UPDATE product"))).hasSize(2);
        assertThat(sql.getAllValues().stream()
                .filter(value -> value.contains("INSERT INTO audit_record"))).hasSize(2);
        assertThat(args.getAllValues()).containsExactly(
                new Object[]{0, 9L, 1},
                new Object[]{"product", 9L, "在售商品", "disable", "1", "0",
                        "旧接口单项状态管理", 7L, "admin"},
                new Object[]{1, 10L, 0},
                new Object[]{"product", 10L, "下架商品", "enable", "0", "1",
                        "旧接口单项状态管理", 7L, "admin"});
    }

    @Test
    void productStatusRejectsMissingAndIllegalTransitions() {
        when(jdbcTemplate.queryForList(anyString(), eq(404L))).thenReturn(List.of());
        assertThatThrownBy(() -> service.updateProductStatus(7L, 404L, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("商品不存在");

        assertThatThrownBy(() -> service.updateProductStatus(7L, 8L, 2))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("商品状态");
    }

    @Test
    void shopTransitionsWriteApproveRejectDisableAndEnableAuditRecords() {
        when(jdbcTemplate.queryForList(anyString(), eq(11L)))
                .thenReturn(List.of(row("id", 11L, "name", "待审店铺", "status", 0)));
        when(jdbcTemplate.queryForList(anyString(), eq(16L)))
                .thenReturn(List.of(row("id", 16L, "name", "待审店铺二", "status", 0)));
        when(jdbcTemplate.queryForList(anyString(), eq(12L)))
                .thenReturn(List.of(row("id", 12L, "name", "营业店铺", "status", 1)));
        when(jdbcTemplate.queryForList(anyString(), eq(13L)))
                .thenReturn(List.of(row("id", 13L, "name", "禁用店铺", "status", 2)));
        when(jdbcTemplate.queryForList(anyString(), eq(14L)))
                .thenReturn(List.of(row("id", 14L, "name", "拒绝店铺", "status", 3)));
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq(7L)))
                .thenReturn("admin");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        service.updateShopStatus(7L, 16L, 1);
        service.updateShopStatus(7L, 11L, 3);
        service.updateShopStatus(7L, 12L, 2);
        service.updateShopStatus(7L, 13L, 1);
        service.updateShopStatus(7L, 14L, 1);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> args = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate, org.mockito.Mockito.times(10))
                .update(sql.capture(), args.capture());
        assertThat(sql.getAllValues().stream()
                .filter(value -> value.contains("INSERT INTO audit_record"))).hasSize(5);
        assertThat(sql.getAllValues().stream()
                .filter(value -> value.contains("UPDATE shop"))).hasSize(5);
        assertThat(args.getAllValues().stream()
                .filter(values -> values.length == 9 && "shop".equals(values[0])))
                .containsExactly(
                        new Object[]{"shop", 16L, "待审店铺二", "approve", "0", "1", null, 7L, "admin"},
                        new Object[]{"shop", 11L, "待审店铺", "reject", "0", "3",
                                "旧接口单项审核拒绝", 7L, "admin"},
                        new Object[]{"shop", 12L, "营业店铺", "disable", "1", "2",
                                "旧接口单项状态管理", 7L, "admin"},
                        new Object[]{"shop", 13L, "禁用店铺", "enable", "2", "1",
                                "旧接口单项状态管理", 7L, "admin"},
                        new Object[]{"shop", 14L, "拒绝店铺", "enable", "3", "1",
                                "旧接口单项状态管理", 7L, "admin"});
    }

    @Test
    void shopStatusRejectsMissingAndIllegalTransitions() {
        when(jdbcTemplate.queryForList(anyString(), eq(404L))).thenReturn(List.of());
        assertThatThrownBy(() -> service.updateShopStatus(7L, 404L, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("店铺不存在");

        when(jdbcTemplate.queryForList(anyString(), eq(15L)))
                .thenReturn(List.of(row("id", 15L, "name", "营业店铺", "status", 1)));
        assertThatThrownBy(() -> service.updateShopStatus(7L, 15L, 3))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("不允许店铺状态");
    }

    @Test
    void extremePageIsRejectedBeforeOffsetCanOverflow() {
        assertThatThrownBy(() -> service.listAudits(
                null, null, Integer.MAX_VALUE, 200))
                .isInstanceOf(BusinessException.class)
                .hasMessage("页码过大");
        assertThatThrownBy(() -> service.listAuditHistory(
                null, Integer.MAX_VALUE, Integer.MAX_VALUE))
                .isInstanceOf(BusinessException.class)
                .hasMessage("页码过大");

        verify(jdbcTemplate, never()).queryForObject(anyString(), eq(Long.class), any(Object[].class));
    }

    @Test
    void auditQueueUsesDeterministicNewestFirstOrdering() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any(Object[].class)))
                .thenReturn(0L);
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());

        service.listAudits(null, null, 1, 20);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).queryForList(sql.capture(), any(Object[].class));
        assertThat(sql.getValue()).contains(
                "ORDER BY createTime DESC, id DESC, type ASC LIMIT ? OFFSET ?");
    }

    @Test
    void missingDetailRaisesBusinessErrorWithoutReturningPassword() {
        when(jdbcTemplate.queryForList(anyString(), eq(404L))).thenReturn(List.of());

        assertThatThrownBy(() -> service.userDetail(404L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("用户不存在");

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).queryForList(sql.capture(), eq(404L));
        assertThat(sql.getValue().toLowerCase()).doesNotContain("password");
    }

    @Test
    void orderDetailBuildsChronologicalTimelineIncludingRefunds() {
        when(jdbcTemplate.queryForList(anyString(), eq("O-D"))).thenReturn(
                List.of(row(
                        "id", 10L, "orderNo", "O-D", "status", 4,
                        "createTime", "2026-08-14 09:00:00",
                        "payTime", "2026-08-14 09:05:00",
                        "deliveryTime", "2026-08-14 10:00:00",
                        "receiveTime", null, "cancelTime", "2026-08-14 11:00:00")),
                List.of(),
                List.of(row("paymentNo", "P-D", "payTime", "2026-08-14 09:05:00")),
                List.of(
                        row(
                                "id", 2L, "orderNo", "O-D", "amount", new BigDecimal("5.00"),
                                "reason", "退款处理中", "status", 0, "operatorName", "admin",
                                "createTime", "2026-08-14 09:30:00"),
                        row(
                                "id", 3L, "orderNo", "O-D", "amount", new BigDecimal("10.00"),
                                "reason", "退款完成", "status", 1, "operatorName", "admin",
                                "createTime", "2026-08-14 10:30:00"),
                        row(
                                "id", 4L, "orderNo", "O-D", "amount", new BigDecimal("3.00"),
                                "reason", "退款失败", "status", 2, "operatorName", "admin",
                                "createTime", "2026-08-14 10:45:00")));

        Map<String, Object> detail = service.orderDetail("O-D");

        List<Map<String, Object>> timeline = (List<Map<String, Object>>) detail.get("timeline");
        assertThat(timeline).extracting(item -> item.get("label"))
                .containsExactly(
                        "订单创建", "支付完成", "退款处理中", "订单发货",
                        "退款完成", "退款失败", "订单关闭");
        assertThat(detail).containsKeys("order", "items", "payment", "refunds", "timeline");
    }

    @Test
    void deliveryRequiresPaidUndeliveredOrderAndCompleteLogistics() {
        AdminDeliverRequest missing = new AdminDeliverRequest();
        missing.setLogisticsCompany("顺丰");
        assertThatThrownBy(() -> service.deliverOrder("O-1", missing))
                .isInstanceOf(BusinessException.class)
                .hasMessage("物流单号不能为空");

        when(jdbcTemplate.queryForList(anyString(), eq("O-2")))
                .thenReturn(List.of(row("id", 2L, "status", 2)));
        AdminDeliverRequest request = new AdminDeliverRequest();
        request.setLogisticsCompany("顺丰");
        request.setLogisticsNo("SF001");

        assertThatThrownBy(() -> service.deliverOrder("O-2", request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("只有待发货订单可以发货");
    }

    @Test
    void closesPendingOrderAndUnlocksStockWithoutGoingBelowZero() {
        when(jdbcTemplate.queryForList(anyString(), eq("O-1")))
                .thenReturn(List.of(row("id", 11L, "status", 0)));
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);
        AdminCloseOrderRequest request = new AdminCloseOrderRequest();
        request.setReason("买家取消");

        service.closeOrder("O-1", request);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, org.mockito.Mockito.times(2))
                .update(sql.capture(), any(Object[].class));
        assertThat(sql.getAllValues().get(0))
                .contains("SUM(quantity)")
                .contains("GREATEST(0, s.locked_stock - oi.quantity)");
        assertThat(sql.getAllValues().get(1)).contains("status = 4").contains("cancel_reason");
    }

    @Test
    void closeRejectsPaidOrderAndBlankReason() {
        AdminCloseOrderRequest blank = new AdminCloseOrderRequest();
        blank.setReason(" ");
        assertThatThrownBy(() -> service.closeOrder("O-3", blank))
                .isInstanceOf(BusinessException.class)
                .hasMessage("关闭原因不能为空");

        when(jdbcTemplate.queryForList(anyString(), eq("O-3")))
                .thenReturn(List.of(row("id", 3L, "status", 1)));
        AdminCloseOrderRequest request = new AdminCloseOrderRequest();
        request.setReason("后台关闭");
        assertThatThrownBy(() -> service.closeOrder("O-3", request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("只有待付款订单可以关闭，已支付订单请走退款流程");
        verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
    }

    @Test
    void refundRejectsInvalidStateAndAmountAboveRemainingPaidAmount() {
        AdminRefundOrderRequest request = refundRequest("20.01", "售后退款");
        when(jdbcTemplate.queryForList(anyString(), eq("O-4")))
                .thenReturn(List.of(row(
                        "id", 4L, "orderNo", "O-4", "userId", 9L,
                        "status", 4, "payAmount", new BigDecimal("100.00"))));
        assertThatThrownBy(() -> service.refundOrder(7L, "O-4", request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("当前订单状态不允许退款");

        when(jdbcTemplate.queryForList(anyString(), eq("O-2")))
                .thenReturn(List.of(row(
                        "id", 2L, "orderNo", "O-2", "userId", 9L,
                        "status", 2, "payAmount", new BigDecimal("100.00"))));
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(2L)))
                .thenReturn(new BigDecimal("80.00"));
        assertThatThrownBy(() -> service.refundOrder(7L, "O-2", request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("退款金额超过剩余可退金额");
    }

    @Test
    void refundRequiresPositiveAmountAndReasonBeforeDatabaseAccess() {
        assertThatThrownBy(() -> service.refundOrder(7L, "O-0", refundRequest("0", "原因")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("退款金额必须大于 0");
        assertThatThrownBy(() -> service.refundOrder(7L, "O-0", refundRequest("1", " ")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("退款原因不能为空");

        verify(jdbcTemplate, never()).queryForList(anyString(), any(Object[].class));
    }

    @Test
    void refundRejectsAmountsWithMoreThanTwoFractionDigitsBeforeDatabaseAccess() {
        assertThatThrownBy(() -> service.refundOrder(
                7L, "O-0", refundRequest("0.009", "精度校验")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("退款金额最多保留两位小数");
        assertThatThrownBy(() -> service.refundOrder(
                7L, "O-0", refundRequest("0.001", "精度校验")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("退款金额最多保留两位小数");

        verify(jdbcTemplate, never()).queryForList(anyString(), any(Object[].class));
    }

    @Test
    void fullRefundMarksOrderRefundedAndPaymentRefunded() {
        when(jdbcTemplate.queryForList(anyString(), eq("O-8")))
                .thenReturn(List.of(row(
                        "id", 8L, "orderNo", "O-8", "userId", 9L,
                        "status", 1, "payAmount", new BigDecimal("100.00"))));
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(8L)))
                .thenReturn(new BigDecimal("40.00"));
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq(7L)))
                .thenReturn("admin");

        service.refundOrder(7L, "O-8", refundRequest("60.00", "全额退款"));

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, org.mockito.Mockito.times(3))
                .update(sql.capture(), any(Object[].class));
        assertThat(sql.getAllValues().get(0)).contains("INSERT INTO refund_record");
        assertThat(sql.getAllValues().get(1)).contains("status = 5");
        assertThat(sql.getAllValues().get(2)).contains("payment").contains("status = 3");
    }

    @Test
    void partialRefundKeepsOrderStatus() {
        when(jdbcTemplate.queryForList(anyString(), eq("O-9")))
                .thenReturn(List.of(row(
                        "id", 9L, "orderNo", "O-9", "userId", 10L,
                        "status", 2, "payAmount", new BigDecimal("100.00"))));
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), eq(9L)))
                .thenReturn(BigDecimal.ZERO);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq(7L)))
                .thenReturn("admin");

        service.refundOrder(7L, "O-9", refundRequest("25.00", "部分退款"));

        verify(jdbcTemplate, org.mockito.Mockito.times(1))
                .update(anyString(), any(Object[].class));
    }

    private static AdminBatchAuditRequest auditRequest(
            String type, List<Long> ids, String action, String reason) {
        AdminBatchAuditRequest request = new AdminBatchAuditRequest();
        request.setType(type);
        request.setIds(ids);
        request.setAction(action);
        request.setReason(reason);
        return request;
    }

    private static AdminRefundOrderRequest refundRequest(String amount, String reason) {
        AdminRefundOrderRequest request = new AdminRefundOrderRequest();
        request.setAmount(new BigDecimal(amount));
        request.setReason(reason);
        return request;
    }

    private static Map<String, Object> row(Object... values) {
        Map<String, Object> row = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            row.put((String) values[index], values[index + 1]);
        }
        return row;
    }

    private static String clauseExpression(String sql, String startToken, String endToken) {
        int start = sql.indexOf(startToken) + startToken.length();
        int end = sql.indexOf(endToken, start);
        return sql.substring(start, end).trim();
    }
}
