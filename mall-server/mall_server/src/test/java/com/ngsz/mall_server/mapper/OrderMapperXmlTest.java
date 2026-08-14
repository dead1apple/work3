package com.ngsz.mall_server.mapper;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

class OrderMapperXmlTest {

    private static final Pattern UNQUOTED_ORDER_TABLE = Pattern.compile(
            "(?i)\\b(?:from|into|update|join)\\s+order\\b"
    );

    @Test
    void quotesOrderTableBecauseOrderIsAMysqlReservedWord() throws IOException {
        try (InputStream input = getClass().getResourceAsStream("/mapper/OrderMapper.xml")) {
            assertThat(input).isNotNull();
            String mapperXml = new String(input.readAllBytes(), StandardCharsets.UTF_8);

            assertThat(UNQUOTED_ORDER_TABLE.matcher(mapperXml).find()).isFalse();
        }
    }
}
