package com.ngsz.mall_server.service;

import com.ngsz.mall_server.common.exception.BusinessException;
import com.ngsz.mall_server.pojo.vo.ImageUploadVO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class ImageStorageService {
    private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024;
    private static final DateTimeFormatter DATE_PATH_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    private final Path uploadRoot;

    public ImageStorageService(@Value("${mall.upload.directory:uploads}") String uploadDirectory) {
        this.uploadRoot = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    public ImageUploadVO store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BusinessException("请选择要上传的图片");
        if (file.getSize() > MAX_IMAGE_SIZE) throw new BusinessException("图片大小不能超过 10 MB");

        String extension;
        try (InputStream raw = file.getInputStream(); BufferedInputStream input = new BufferedInputStream(raw)) {
            input.mark(16);
            extension = detectExtension(input);
            input.reset();

            String datePath = LocalDate.now().format(DATE_PATH_FORMAT);
            Path directory = uploadRoot.resolve("images").resolve(datePath).normalize();
            if (!directory.startsWith(uploadRoot)) throw new BusinessException("上传目录配置不正确");
            Files.createDirectories(directory);

            String storedName = UUID.randomUUID() + "." + extension;
            Path target = directory.resolve(storedName);
            Files.copy(input, target);
            String url = "/uploads/images/" + datePath + "/" + storedName;
            return new ImageUploadVO(url, file.getOriginalFilename(), file.getSize());
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException("图片保存失败，请稍后重试");
        }
    }

    private String detectExtension(InputStream input) throws IOException {
        byte[] header = input.readNBytes(12);
        if (header.length >= 3 && unsigned(header[0]) == 0xff && unsigned(header[1]) == 0xd8
                && unsigned(header[2]) == 0xff) {
            return "jpg";
        }
        if (header.length >= 8 && unsigned(header[0]) == 0x89 && header[1] == 'P' && header[2] == 'N'
                && header[3] == 'G' && unsigned(header[4]) == 0x0d && unsigned(header[5]) == 0x0a
                && unsigned(header[6]) == 0x1a && unsigned(header[7]) == 0x0a) {
            return "png";
        }
        if (header.length >= 6 && header[0] == 'G' && header[1] == 'I' && header[2] == 'F'
                && header[3] == '8' && (header[4] == '7' || header[4] == '9') && header[5] == 'a') {
            return "gif";
        }
        if (header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F'
                && header[3] == 'F' && header[8] == 'W' && header[9] == 'E' && header[10] == 'B'
                && header[11] == 'P') {
            return "webp";
        }
        throw new BusinessException("仅支持 JPEG、PNG、GIF 或 WebP 图片");
    }

    private int unsigned(byte value) {
        return value & 0xff;
    }
}
