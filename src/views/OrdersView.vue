<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrders } from '../api/index.js'
import { normalizeOrderList, formatMoney } from '../utils/commerce.js'
const route = useRoute(); const router = useRouter(); const loading = ref(true); const list = ref([]); const status = ref(''); const total = ref(0); const page = ref(1)
const load = async () => { loading.value = true; try { const result = normalizeOrderList(await getOrders({ status: status.value || undefined, page: page.value, size: 10 })); list.value = result.list; total.value = result.total } finally { loading.value = false } }
onMounted(load); watch(() => route.query.status, (value) => { status.value = value || ''; page.value = 1; load() })
</script>
<template><section class="commerce-page"><div class="page-title"><div><p>ORDERS</p><h1>我的订单</h1></div></div><el-radio-group v-model="status" @change="page=1;load()"><el-radio-button label="">全部</el-radio-button><el-radio-button label="1">待付款</el-radio-button><el-radio-button label="2">待发货</el-radio-button><el-radio-button label="3">待收货</el-radio-button><el-radio-button label="4">待评价</el-radio-button></el-radio-group><el-skeleton v-if="loading" :rows="8" animated/><el-empty v-else-if="!list.length" description="暂无订单"/><article v-else v-for="item in list" :key="item.orderNo" class="order-card" @click="router.push(`/orders/${item.orderNo}`)"><div><strong>订单号：{{ item.orderNo }}</strong><span>{{ item.statusText }}</span></div><p>{{ item.items.map((line) => line.productName || line.skuName || '商品').join('、') || '查看订单详情' }}</p><strong class="order-price">￥{{ formatMoney(item.totalAmount) }}</strong></article><el-pagination v-if="total>10" v-model:current-page="page" :total="total" :page-size="10" layout="prev, pager, next" class="pager" @current-change="load"/></section></template>
