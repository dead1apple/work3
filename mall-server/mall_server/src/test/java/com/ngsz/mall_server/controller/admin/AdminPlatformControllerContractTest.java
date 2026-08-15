package com.ngsz.mall_server.controller.admin;

import com.ngsz.mall_server.service.AdminPlatformService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminPlatformControllerContractTest {

    @Test
    void dashboardResponseUsesFrontendCamelCaseContract() throws Exception {
        AdminPlatformService service = mock(AdminPlatformService.class);
        when(service.dashboard(30)).thenReturn(Map.of(
                "days", 30,
                "metrics", Map.ofEntries(
                        Map.entry("userCount", 1L),
                        Map.entry("activeUserCount", 1L),
                        Map.entry("productCount", 2L),
                        Map.entry("activeProductCount", 1L),
                        Map.entry("orderCount", 3L),
                        Map.entry("paidOrderCount", 2L),
                        Map.entry("shopCount", 1L),
                        Map.entry("activeShopCount", 1L),
                        Map.entry("revenue", new BigDecimal("88.00")),
                        Map.entry("completionRate", new BigDecimal("50.00")),
                        Map.entry("couponUsageRate", new BigDecimal("25.00")),
                        Map.entry("pendingAuditCount", 2L)),
                "trend", List.of(Map.of(
                        "date", "2026-08-14", "revenue", new BigDecimal("88.00"), "orders", 2L)),
                "orderStates", List.of(Map.of("status", 1, "count", 2L)),
                "topProducts", List.of(Map.of(
                        "id", 1L, "name", "商品", "image", "/p.png",
                        "value", 2L, "secondary", new BigDecimal("88.00"))),
                "topShops", List.of(),
                "pending", Map.of("products", 1L, "shops", 1L, "refunds", 0L)));
        MockMvc mvc = MockMvcBuilders
                .standaloneSetup(new AdminDashboardController(service)).build();

        mvc.perform(get("/api/admin/dashboard").param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.metrics.userCount").value(1))
                .andExpect(jsonPath("$.data.metrics.paidOrderCount").value(2))
                .andExpect(jsonPath("$.data.trend[0].date").value("2026-08-14"))
                .andExpect(jsonPath("$.data.topProducts[0].secondary").value(88.0))
                .andExpect(jsonPath("$.data.pending.products").value(1));
    }
}
