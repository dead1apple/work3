<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { createReview } from '../api/index.js'
const route = useRoute(); const router = useRouter(); const form = ref({ orderNo: route.params.orderNo, orderItemId: '', rating: 5, content: '', images: [], isAnonymous: false })
const submit = async () => { if (!form.value.orderItemId || !form.value.content.trim()) return ElMessage.warning('请填写订单商品编号和评价内容'); await createReview(form.value); ElMessage.success('评价发布成功'); router.replace(`/orders/${route.params.orderNo}`) }
</script>
<template><section class="commerce-page narrow"><div class="page-title"><div><p>REVIEW</p><h1>发表评价</h1></div></div><el-form label-position="top"><el-form-item label="订单商品编号"><el-input v-model="form.orderItemId" placeholder="请从订单详情填写商品编号"/></el-form-item><el-form-item label="评分"><el-rate v-model="form.rating" show-text/></el-form-item><el-form-item label="评价内容"><el-input v-model="form.content" type="textarea" :rows="5" maxlength="500" show-word-limit/></el-form-item><el-checkbox v-model="form.isAnonymous">匿名评价</el-checkbox><br><el-button type="primary" size="large" @click="submit">发布评价</el-button></el-form></section></template>
