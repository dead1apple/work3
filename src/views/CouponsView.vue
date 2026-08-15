<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { claimCoupon, getAvailableCoupons, getMyCoupons } from '../api/index.js'
const tab = ref('available'); const available = ref([]); const mine = ref([]); const status = ref('')
const asList = (value) => Array.isArray(value) ? value : (value?.list || [])
const loadAvailable = async () => { available.value = asList(await getAvailableCoupons()) }
const loadMine = async () => { mine.value = asList(await getMyCoupons({ status: status.value || undefined })) }
const claim = async (item) => { await claimCoupon(item.templateId || item.id); ElMessage.success('领取成功'); await Promise.all([loadAvailable(), loadMine()]) }
onMounted(() => Promise.all([loadAvailable(), loadMine()]))
</script>
<template><section class="commerce-page"><div class="page-title"><div><p>COUPONS</p><h1>优惠券</h1></div></div><el-tabs v-model="tab"><el-tab-pane label="可领取" name="available"><el-empty v-if="!available.length" description="暂无可领取优惠券"/><article v-for="item in available" :key="item.id || item.templateId" class="coupon-card"><div><strong>￥{{ item.amount }}</strong><span>满 {{ item.threshold || item.minAmount || 0 }} 可用</span><p>{{ item.name }}</p></div><el-button type="primary" @click="claim(item)">立即领取</el-button></article></el-tab-pane><el-tab-pane label="我的优惠券" name="mine"><el-radio-group v-model="status" size="small" @change="loadMine"><el-radio-button label="">全部</el-radio-button><el-radio-button label="unused">未使用</el-radio-button><el-radio-button label="used">已使用</el-radio-button></el-radio-group><el-empty v-if="!mine.length" description="暂无优惠券"/><article v-for="item in mine" :key="item.id" class="coupon-card"><div><strong>￥{{ item.amount }}</strong><span>满 {{ item.threshold || item.minAmount || 0 }} 可用</span><p>{{ item.name }}</p></div><el-tag>{{ item.statusName || item.status }}</el-tag></article></el-tab-pane></el-tabs></section></template>
