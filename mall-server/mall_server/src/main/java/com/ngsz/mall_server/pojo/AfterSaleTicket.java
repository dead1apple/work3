package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "售后工单")
public class AfterSaleTicket {

    @Schema(description = "工单 ID", example = "1")
    private Long id;
    private String ticketNo;
    private Long userId;
    private Long shopId;
    private Long orderId;
    private String orderNo;
    private Long orderItemId;
    private Long productId;
    private Long skuId;
    private String type;
    private String reasonType;
    private String description;
    private Integer status;
    private String rejectReason;
    private String finalResult;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime closeTime;
}
