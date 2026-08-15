package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AdminPlatformRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void requestDtosExposeRequiredTransportValidation() {
        AdminBatchAuditRequest audit = new AdminBatchAuditRequest();
        audit.setType("product");
        audit.setAction("approve");
        audit.setIds(List.of());
        assertThat(validator.validate(audit)).extracting("propertyPath").extracting(Object::toString)
                .contains("ids");

        AdminDeliverRequest deliver = new AdminDeliverRequest();
        assertThat(validator.validate(deliver)).extracting("propertyPath").extracting(Object::toString)
                .contains("logisticsCompany", "logisticsNo");

        AdminCloseOrderRequest close = new AdminCloseOrderRequest();
        assertThat(validator.validate(close)).extracting("propertyPath").extracting(Object::toString)
                .contains("reason");

        AdminRefundOrderRequest refund = new AdminRefundOrderRequest();
        refund.setAmount(BigDecimal.ZERO);
        assertThat(validator.validate(refund)).extracting("propertyPath").extracting(Object::toString)
                .contains("amount", "reason");
    }

    @Test
    void refundAmountRejectsMoreThanTwoFractionDigits() {
        AdminRefundOrderRequest refund = new AdminRefundOrderRequest();
        refund.setAmount(new BigDecimal("0.009"));
        refund.setReason("精度校验");

        assertThat(validator.validate(refund)).extracting("propertyPath").extracting(Object::toString)
                .contains("amount");
    }
}
