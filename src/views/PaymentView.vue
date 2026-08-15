<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { confirmPayment, createPayment, getPaymentStatus } from '../api/index.js'
const route = useRoute(); const router = useRouter(); const loading = ref(false); const status = ref('待支付'); let timer
const check = async () => { const result = await getPaymentStatus(route.params.orderNo); status.value = result?.statusName || result?.status || '待支付'; if (String(status.value).match(/成功|已支付|paid/i)) clearInterval(timer) }
const pay = async () => { loading.value = true; try { const payment = await createPayment({ orderNo: route.params.orderNo, payType: 'MOCK' }); const paymentNo = payment?.paymentNo || payment?.id || payment; await confirmPayment({ paymentNo }); await check(); ElMessage.success('支付成功') } catch (error) { ElMessage.error(error.message || '支付失败') } finally { loading.value = false } }
onMounted(async () => { await check(); timer = setInterval(check, 5000) }); onUnmounted(() => clearInterval(timer))
</script>
<template><section class="commerce-page narrow payment-page"><p>MOCK PAYMENT</p><h1>订单收银台</h1><div class="payment-box"><span>订单号：{{ route.params.orderNo }}</span><strong>{{ status }}</strong><el-button type="primary" size="large" :loading="loading" @click="pay">确认模拟支付</el-button><el-button link @click="router.push('/orders')">查看我的订单</el-button></div></section></template>
