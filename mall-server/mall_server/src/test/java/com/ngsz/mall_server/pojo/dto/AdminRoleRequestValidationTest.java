package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AdminRoleRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void enforcesRoleFieldAndPermissionCollectionLimits() {
        AdminRoleRequest request = new AdminRoleRequest();
        request.setName("n".repeat(51));
        request.setCode("C".repeat(51));
        request.setPermissions(List.of("p".repeat(129)));

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("name", "code", "permissions[0].<list element>");
    }
}
