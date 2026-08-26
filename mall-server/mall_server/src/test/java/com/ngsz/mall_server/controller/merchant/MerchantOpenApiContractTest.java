package com.ngsz.mall_server.controller.merchant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MerchantOpenApiContractTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void merchantEndpointsExposeConcreteResponseAndUploadSchemas() throws Exception {
        String json = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode openApi = objectMapper.readTree(json);

        JsonNode paths = openApi.path("paths");
        assertThat(paths.has("/api/merchant/products/{id}")).isTrue();
        assertThat(paths.has("/api/merchant/orders/{orderNo}")).isTrue();
        assertThat(paths.has("/api/merchant/uploads/images")).isTrue();

        assertResponseSchema(paths, "/api/merchant/products", "get", "ResultPageResultProductListItemVO");
        assertResponseSchema(paths, "/api/merchant/products", "post", "ResultProductDetailVO");
        assertResponseSchema(paths, "/api/merchant/products/{id}", "get", "ResultProductDetailVO");
        assertResponseSchema(paths, "/api/merchant/orders/{orderNo}", "get", "ResultOrderDetailVO");

        JsonNode fileSchema = paths.path("/api/merchant/uploads/images").path("post")
                .path("requestBody").path("content").path("multipart/form-data")
                .path("schema").path("properties").path("file");
        assertThat(fileSchema.path("type").asText()).isEqualTo("string");
        assertThat(fileSchema.path("format").asText()).isEqualTo("binary");
    }

    private void assertResponseSchema(JsonNode paths, String path, String method, String schemaName) {
        JsonNode content = paths.path(path).path(method).path("responses").path("200").path("content");
        JsonNode schema = content.elements().next().path("schema");
        assertThat(schema.path("$ref").asText()).endsWith("/" + schemaName);
    }
}
