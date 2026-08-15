<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFavorites, removeFavorite } from '../api/index.js'
import { normalizeProductList } from '../utils/commerce.js'
const router = useRouter(); const list = ref([])
const load = async () => { list.value = normalizeProductList(await getFavorites()).list }
const remove = async (item) => { await removeFavorite(item.id); list.value = list.value.filter((entry) => entry.id !== item.id); ElMessage.success('已取消收藏') }
onMounted(load)
</script>
<template><section class="commerce-page"><div class="page-title"><div><p>WISHLIST</p><h1>我的收藏</h1></div></div><el-empty v-if="!list.length" description="暂未收藏商品"/><el-row v-else :gutter="16" class="product-grid"><el-col v-for="item in list" :key="item.id" :xs="12" :sm="8" :md="6"><el-card class="commerce-card"><img :src="item.image" :alt="item.title" @click="router.push(`/product/${item.id}`)"><h3>{{ item.title }}</h3><strong>￥{{ item.price.toFixed(2) }}</strong><el-button link type="danger" @click="remove(item)">取消收藏</el-button></el-card></el-col></el-row></section></template>
