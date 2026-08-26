package com.ngsz.mall_server.controller.merchant;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.vo.ImageUploadVO;
import com.ngsz.mall_server.service.ImageStorageService;
import com.ngsz.mall_server.service.impl.MerchantAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "19. 商家-文件", description = "商家图片上传")
@RestController
@RequestMapping("/api/merchant/uploads")
@SecurityRequirement(name = "Authorization")
public class MerchantUploadController {
    private final ImageStorageService imageStorageService;
    private final MerchantAccessService merchantAccessService;

    public MerchantUploadController(
            ImageStorageService imageStorageService,
            MerchantAccessService merchantAccessService) {
        this.imageStorageService = imageStorageService;
        this.merchantAccessService = merchantAccessService;
    }

    @Operation(summary = "上传图片", description = "上传商品主图、详情图或 SKU 图片，支持 JPEG、PNG、GIF、WebP，最大 10 MB")
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<ImageUploadVO> uploadImage(
            @Parameter(description = "图片文件", required = true) @RequestPart("file") MultipartFile file) {
        merchantAccessService.requireActiveShop(StpUtil.getLoginIdAsLong());
        ImageUploadVO uploaded = imageStorageService.store(file);
        uploaded.setUrl(ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(uploaded.getUrl()).build().toUriString());
        return Result.success(uploaded);
    }
}
