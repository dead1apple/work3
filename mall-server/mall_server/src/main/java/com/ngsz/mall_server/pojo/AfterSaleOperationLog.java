package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "售后工单操作记录")
public class AfterSaleOperationLog {
    private Long id;
    private Long ticketId;
    private Long operatorId;
    private String operatorType;
    private String operation;
    private Integer beforeStatus;
    private Integer afterStatus;
    private String reason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
