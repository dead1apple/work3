<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { cancelOrder, deleteOrder, getOrderDetail, receiveOrder } from '../api/index.js'
import { formatMoney } from '../utils/commerce.js'
const route = useRoute(); const router = useRouter(); const order = ref(null); const load = async () => { order.value = await getOrderDetail(route.params.orderNo) }
const cancel = async () => { await ElMessageBox.confirm('确定取消此订单吗？', '取消订单', { type: 'warning' }); await cancelOrder(route.params.orderNo); await load(); ElMessage.success('订单已取消') }
const receive = async () => { await receiveOrder(route.params.orderNo); await load(); ElMessage.success('已确认收货') }
const remove = async () => { await ElMessageBox.confirm('确定删除此订单吗？', '删除订单', { type: 'warning' }); await deleteOrder(route.params.orderNo); router.replace('/orders') }
onMounted(load)
</script>
<template><section class="commerce-page"><el-skeleton v-if="!order" :rows="10" animated/><template v-else><div class="page-title"><div><p>ORDER DETAIL</p><h1>{{ order.statusName || '订单详情' }}</h1></div><span>订单号：{{ route.params.orderNo }}</span></div><article v-for="item in order.items || order.orderItems || []" :key="item.id" class="order-line"><img :src="item.image || item.productImage"><span>{{ item.productName || item.skuName }}</span><span>× {{ item.quantity }}</span><strong>￥{{ formatMoney(item.price * item.quantity) }}</strong></article><div class="order-meta"><p>收货地址：{{ order.address?.receiverName }} {{ order.address?.receiverPhone }} {{ order.address?.detailAddress }}</p><p>实付金额：<strong>￥{{ formatMoney(order.totalAmount || order.payAmount) }}</strong></p></div><div class="action-group"><el-button v-if="[0,1].includes(Number(order.status))" @click="cancel">取消订单</el-button><el-button v-if="Number(order.status)===3" type="primary" @click="receive">确认收货</el-button><el-button v-if="Number(order.status)===4" type="primary" @click="router.push(`/orders/${route.params.orderNo}/review`)">去评价</el-button><el-button v-if="[5,6].includes(Number(order.status))" type="danger" plain @click="remove">删除订单</el-button><el-button v-if="[0,1].includes(Number(order.status))" type="danger" @click="router.push(`/payment/${route.params.orderNo}`)">去支付</el-button></div></template></section></template>
