package com.ngsz.mall_server.mapper;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryMapperXmlTest {

    @Test
    void adminCategoryUpdateCanMoveCategoryAndChangeItsLevel() throws IOException {
        try (InputStream input = getClass().getResourceAsStream("/mapper/CategoryMapper.xml")) {
            assertThat(input).isNotNull();
            String mapperXml = new String(input.readAllBytes(), StandardCharsets.UTF_8);

            assertThat(mapperXml).contains("parent_id = #{parentId}");
            assertThat(mapperXml).contains("level = #{level}");
        }
    }
}
