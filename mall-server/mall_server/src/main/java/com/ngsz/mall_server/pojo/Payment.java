package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "支付流水")
public class Payment {

    @Schema(description = "支付记录 ID", example = "1")
    private Long id;

    @Schema(description = "支付单号（业务编号）", example = "PAY202606300001")
    private String paymentNo;

    @Schema(description = "关联订单号", example = "202606300001")
    private String orderNo;

    @Schema(description = "支付用户 ID", example = "1")
    private Long userId;

    @Schema(description = "支付方式：1 微信，2 支付宝，3 余额", example = "1")
    private Integer payType;

    @Schema(description = "支付金额（元）", example = "270.00")
    private BigDecimal amount;

    @Schema(description = "支付状态：0 待支付，1 支付成功，2 支付失败，3 已退款", example = "0")
    private Integer status;

    @Schema(description = "第三方支付平台流水号", example = "wx202606300001")
    private String thirdPartyNo;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "支付完成时间")
    private LocalDateTime payTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
