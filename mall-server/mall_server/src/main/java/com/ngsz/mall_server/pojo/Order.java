package com.ngsz.mall_server.pojo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Schema(description = "订单")
public class Order {

    @Schema(description = "订单 ID（数据库主键）", example = "1")
    private Long id;

    @Schema(description = "订单号（业务编号，对外使用）", example = "202606300001")
    private String orderNo;

    @Schema(description = "下单用户 ID", example = "1")
    private Long userId;

    @Schema(description = "店铺 ID", example = "100")
    private Long shopId;

    @Schema(description = "订单总金额（元，商品合计）", example = "300.00")
    private BigDecimal totalAmount;

    @Schema(description = "实付金额（元，扣除优惠后）", example = "270.00")
    private BigDecimal payAmount;

    @Schema(description = "运费（元）", example = "0.00")
    private BigDecimal freightAmount;

    @Schema(description = "优惠抵扣金额（元）", example = "30.00")
    private BigDecimal discountAmount;

    @Schema(description = "使用的优惠券 ID，未使用为 null", example = "1")
    private Long couponId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "支付截止时间")
    private LocalDateTime payDeadline;

    @Schema(description = "订单状态：0 待付款，1 待发货，2 待收货，3 已完成，4 已取消，5 已退款", example = "0")
    private Integer status;

    @Schema(description = "收货人姓名", example = "张三")
    private String receiverName;

    @Schema(description = "收货人手机号", example = "13800138000")
    private String receiverPhone;

    @Schema(description = "完整收货地址", example = "广东省深圳市南山区科技园路 1 号 2 栋 3 楼")
    private String receiverAddress;

    @Schema(description = "支付方式：1 微信，2 支付宝，3 余额", example = "1")
    private Integer payType;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "支付时间")
    private LocalDateTime payTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "发货时间")
    private LocalDateTime deliveryTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "确认收货时间")
    private LocalDateTime receiveTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "取消时间")
    private LocalDateTime cancelTime;

    @Schema(description = "取消原因")
    private String cancelReason;

    @Schema(description = "订单备注", example = "请尽快发货")
    private String remark;

    @Schema(description = "物流单号", example = "SF1234567890")
    private String logisticsNo;

    @Schema(description = "物流公司", example = "顺丰快递")
    private String logisticsCompany;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间（下单时间）")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "逻辑删除标记：0 未删，1 已删", hidden = true)
    private Integer deleted;
}
