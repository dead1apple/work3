package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImageStorageServiceTest {
    @TempDir
    Path uploadDirectory;

    @Test
    void storesImageUsingDetectedTypeAndGeneratedName() throws Exception {
        byte[] png = new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3};
        MockMultipartFile file = new MockMultipartFile("file", "product.exe", "application/octet-stream", png);

        var result = new ImageStorageService(uploadDirectory.toString()).store(file);

        assertThat(result.getUrl()).startsWith("/uploads/images/").endsWith(".png");
        assertThat(result.getOriginalName()).isEqualTo("product.exe");
        String relativePath = result.getUrl().substring("/uploads/".length()).replace('/', File.separatorChar);
        assertThat(Files.readAllBytes(uploadDirectory.resolve(relativePath))).isEqualTo(png);
    }

    @Test
    void rejectsFileWhoseContentsAreNotASupportedImage() {
        MockMultipartFile file = new MockMultipartFile("file", "fake.jpg", "image/jpeg", "not an image".getBytes());

        assertThatThrownBy(() -> new ImageStorageService(uploadDirectory.toString()).store(file))
                .isInstanceOf(BusinessException.class)
                .hasMessage("仅支持 JPEG、PNG、GIF 或 WebP 图片");
        assertThat(uploadDirectory).isEmptyDirectory();
    }
}
