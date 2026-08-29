package com.ngsz.mall_server.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.ngsz.mall_server.common.result.Result;
import com.ngsz.mall_server.pojo.vo.ImageUploadVO;
import com.ngsz.mall_server.service.ImageStorageService;
import com.ngsz.mall_server.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserControllerTest {

    @AfterEach
    void clearRequestContext() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void regularUserCanUploadAndUpdateOwnAvatar() {
        UserService userService = mock(UserService.class);
        ImageStorageService imageStorageService = mock(ImageStorageService.class);
        UserController controller = new UserController(userService, imageStorageService);
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[] {1, 2, 3});
        when(imageStorageService.store(file))
                .thenReturn(new ImageUploadVO("/uploads/images/2026/08/29/avatar.png", "avatar.png", 3L));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("https");
        request.setServerName("mall.example.com");
        request.setServerPort(443);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        Result<ImageUploadVO> result;
        try (MockedStatic<StpUtil> stp = mockStatic(StpUtil.class)) {
            stp.when(StpUtil::getLoginIdAsLong).thenReturn(7L);
            result = controller.updateAvatar(file);
        }

        assertThat(result.getCode()).isEqualTo(1);
        assertThat(result.getMsg()).isEqualTo("头像修改成功");
        assertThat(result.getData().getUrl())
                .isEqualTo("https://mall.example.com/uploads/images/2026/08/29/avatar.png");
        verify(userService).updateAvatar(
                7L, "https://mall.example.com/uploads/images/2026/08/29/avatar.png");
    }
}
