package com.ngsz.mall_server.pojo.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProductRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void productRequiresCategoryNameAndAtLeastOneValidSku() {
        ProductDTO dto = new ProductDTO();

        assertThat(validator.validate(dto)).extracting(violation -> violation.getPropertyPath().toString())
                .contains("categoryId", "name", "skuList");
    }

    @Test
    void nestedSkuValidationRejectsMissingDatabaseRequiredFields() {
        ProductDTO dto = new ProductDTO();
        dto.setCategoryId(1L);
        dto.setName("商品");
        dto.setSkuList(List.of(new SkuDTO()));

        assertThat(validator.validate(dto)).extracting(violation -> violation.getPropertyPath().toString())
                .contains("skuList[0].skuName", "skuList[0].price", "skuList[0].stock");
    }

    @Test
    void minimalCreateRequestIsValid() {
        SkuDTO sku = new SkuDTO();
        sku.setSkuName("默认规格");
        sku.setPrice(new BigDecimal("1.00"));
        sku.setStock(0);
        ProductDTO dto = new ProductDTO();
        dto.setCategoryId(1L);
        dto.setName("商品");
        dto.setSkuList(List.of(sku));

        assertThat(validator.validate(dto)).isEmpty();
    }
}
