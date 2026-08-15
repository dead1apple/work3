<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getBrands, getCategoryTree, getProducts } from '../api/index.js'
import { normalizeCategoryTree } from '../utils/category.js'
import { normalizeProductList } from '../utils/commerce.js'
import { flattenCategoryOptions, normalizeSearchQuery, serializeSearchQuery } from '../utils/productSearch.js'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const filterLoading = ref(false)
const loadError = ref('')
const products = ref([])
const total = ref(0)
const brands = ref([])
const categories = ref([])
const keywordDraft = ref('')
const query = reactive(normalizeSearchQuery(route.query))
let requestSequence = 0

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / query.size)))
const selectedCategory = computed(() => categories.value.find((item) => item.id === query.categoryId))
const selectedBrand = computed(() => brands.value.find((item) => item.id === query.brandId))
const hasFilters = computed(() => Boolean(query.keyword || query.categoryId || query.brandId || query.sortBy !== 'default'))

async function loadFilters() {
  filterLoading.value = true
  try {
    const [categoryResult, brandResult] = await Promise.allSettled([getCategoryTree(), getBrands()])
    if (categoryResult.status === 'fulfilled') categories.value = flattenCategoryOptions(normalizeCategoryTree(categoryResult.value))
    if (brandResult.status === 'fulfilled') {
      const payload = brandResult.value
      brands.value = (Array.isArray(payload) ? payload : payload?.list || []).filter((item) => item?.id)
    }
    if (categoryResult.status === 'rejected' || brandResult.status === 'rejected') ElMessage.warning('部分筛选项加载失败，商品搜索仍可使用')
  } finally {
    filterLoading.value = false
  }
}

async function loadProducts() {
  const sequence = ++requestSequence
  loading.value = true
  loadError.value = ''
  try {
    const result = normalizeProductList(await getProducts({
      keyword: query.keyword || undefined,
      categoryId: query.categoryId || undefined,
      brandId: query.brandId || undefined,
      sortBy: query.sortBy,
      page: query.page,
      size: query.size,
    }))
    if (sequence !== requestSequence) return
    products.value = result.list
    total.value = result.total
  } catch (error) {
    if (sequence !== requestSequence) return
    products.value = []
    total.value = 0
    loadError.value = error?.message || '商品加载失败，请稍后重试'
    ElMessage.error(loadError.value)
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

function syncRoute() {
  const nextQuery = serializeSearchQuery(query)
  const currentQuery = Object.fromEntries(Object.entries(route.query).map(([key, value]) => [key, String(value)]))
  if (JSON.stringify(nextQuery) === JSON.stringify(currentQuery)) loadProducts()
  else router.push({ path: '/products', query: nextQuery })
}

function submitKeyword() {
  query.keyword = keywordDraft.value.trim()
  query.page = 1
  syncRoute()
}

function selectFilter(key, value) {
  query[key] = value || null
  query.page = 1
  syncRoute()
}

function selectSort(value) {
  query.sortBy = value
  query.page = 1
  syncRoute()
}

function changePage(page) {
  query.page = page
  syncRoute()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearAll() {
  Object.assign(query, normalizeSearchQuery())
  keywordDraft.value = ''
  syncRoute()
}

function goDetail(id) {
  router.push(`/product/${id}`)
}

watch(() => route.query, (value) => {
  Object.assign(query, normalizeSearchQuery(value))
  keywordDraft.value = query.keyword
  loadProducts()
}, { immediate: true })

onMounted(loadFilters)
</script>

<template>
  <section class="search-page">
    <div class="search-shell">
      <nav class="breadcrumb" aria-label="当前位置"><RouterLink to="/home">首页</RouterLink><span>›</span><strong>{{ query.keyword ? `“${query.keyword}”的搜索结果` : '全部商品' }}</strong></nav>

      <form class="result-search" role="search" @submit.prevent="submitKeyword"><label for="result-keyword">商品搜索</label><div class="result-search-box"><input id="result-keyword" v-model="keywordDraft" type="search" placeholder="请输入商品名称或关键字"><button type="submit">搜索</button></div></form>

      <section class="selector-panel" aria-label="商品筛选">
        <div class="selector-row"><span class="selector-label">分类</span><div v-loading="filterLoading" class="selector-values"><button type="button" :class="{ active: !query.categoryId }" @click="selectFilter('categoryId', null)">全部分类</button><button v-for="item in categories" :key="item.id" type="button" :class="{ active: query.categoryId === item.id }" @click="selectFilter('categoryId', item.id)">{{ item.name }}</button></div></div>
        <div class="selector-row"><span class="selector-label">品牌</span><div v-loading="filterLoading" class="selector-values"><button type="button" :class="{ active: !query.brandId }" @click="selectFilter('brandId', null)">全部品牌</button><button v-for="item in brands" :key="item.id" type="button" :class="{ active: query.brandId === item.id }" @click="selectFilter('brandId', item.id)">{{ item.name }}</button></div></div>
        <div v-if="hasFilters" class="selected-row"><span class="selector-label">已选条件</span><div class="selected-values"><button v-if="query.keyword" type="button" @click="keywordDraft='';query.keyword='';query.page=1;syncRoute()">关键词：{{ query.keyword }} ×</button><button v-if="selectedCategory" type="button" @click="selectFilter('categoryId', null)">分类：{{ selectedCategory.name }} ×</button><button v-if="selectedBrand" type="button" @click="selectFilter('brandId', null)">品牌：{{ selectedBrand.name }} ×</button><button class="clear-button" type="button" @click="clearAll">清空筛选</button></div></div>
      </section>

      <div class="sort-bar"><div class="sort-options"><button type="button" :class="{ active: query.sortBy === 'default' }" @click="selectSort('default')">综合</button><button type="button" :class="{ active: query.sortBy === 'sales' }" @click="selectSort('sales')">销量</button><button type="button" :class="{ active: query.sortBy === 'price_asc' }" @click="selectSort('price_asc')">价格 ↑</button><button type="button" :class="{ active: query.sortBy === 'price_desc' }" @click="selectSort('price_desc')">价格 ↓</button></div><div class="result-count">共 <b>{{ total }}</b> 件商品<span v-if="total">{{ query.page }} / {{ totalPages }}</span></div></div>

      <div v-if="loading" class="product-skeleton"><el-skeleton v-for="item in 8" :key="item" animated><template #template><el-skeleton-item variant="image" class="skeleton-image"/><el-skeleton-item variant="text" class="skeleton-text"/><el-skeleton-item variant="text" class="skeleton-price"/></template></el-skeleton></div>
      <div v-else-if="loadError" class="state-panel"><h2>商品加载失败</h2><p>{{ loadError }}</p><el-button type="primary" @click="loadProducts">重新加载</el-button></div>
      <div v-else-if="!products.length" class="state-panel"><h2>没有找到相关商品</h2><p>可以尝试减少筛选条件，或换一个关键词搜索。</p><el-button type="primary" @click="clearAll">查看全部商品</el-button></div>
      <div v-else class="result-grid">
        <article v-for="item in products" :key="item.id" class="product-item" role="link" tabindex="0" @click="goDetail(item.id)" @keydown.enter="goDetail(item.id)"><div class="product-image"><el-image :src="item.image" :alt="item.title" fit="cover" lazy><template #error><div class="image-placeholder">暂无图片</div></template></el-image><span>京东精选</span></div><div class="product-price"><small>￥</small>{{ item.price.toFixed(2) }}</div><h2>{{ item.title }}</h2><p><b>自营</b> 品质商品 · 放心选购</p><footer><span>已售 {{ item.sales }}</span><button type="button" @click.stop="goDetail(item.id)">查看详情</button></footer></article>
      </div>

      <el-pagination v-if="total > query.size" :current-page="query.page" :page-size="query.size" :total="total" :pager-count="7" background layout="prev, pager, next, jumper" class="result-pagination" @current-change="changePage" />
    </div>
  </section>
</template>

<style scoped>
.search-page{min-height:650px;padding:0 0 48px;font-family:Arial,'Microsoft YaHei',sans-serif;background:#f5f5f5}.search-shell{width:1180px;max-width:calc(100% - 32px);margin:0 auto}.breadcrumb{display:flex;align-items:center;gap:9px;height:44px;color:#777;font-size:12px}.breadcrumb a:hover{color:#e1251b}.breadcrumb strong{max-width:620px;overflow:hidden;color:#333;font-weight:400;text-overflow:ellipsis;white-space:nowrap}.result-search{display:flex;align-items:center;gap:20px;padding:18px 22px;border:1px solid #e4e4e4;background:#fff}.result-search>label{color:#333;font-size:14px;font-weight:700}.result-search-box{display:flex;width:520px;max-width:calc(100% - 90px);height:36px;border:2px solid #e1251b}.result-search-box input{min-width:0;flex:1;padding:0 12px;border:0;outline:0;color:#333;font:inherit}.result-search-box button{width:76px;border:0;color:#fff;background:#e1251b;font-weight:700;cursor:pointer}.selector-panel{margin-top:12px;border-top:1px solid #ddd;border-right:1px solid #ddd;border-left:1px solid #ddd;background:#fff}.selector-row,.selected-row{display:grid;grid-template-columns:108px 1fr;border-bottom:1px solid #ddd}.selector-label{padding:15px 14px;color:#666;background:#f3f3f3;font-size:13px}.selector-values,.selected-values{display:flex;min-height:48px;flex-wrap:wrap;align-content:flex-start;gap:4px 8px;padding:9px 12px}.selector-values button{max-width:240px;padding:5px 9px;border:1px solid transparent;color:#005aa0;background:transparent;font:inherit;font-size:12px;text-align:left;cursor:pointer}.selector-values button:hover{color:#e1251b}.selector-values button.active{border-color:#e1251b;color:#e1251b;background:#fff8f7}.selected-values button{padding:4px 8px;border:1px solid #e5a7a3;color:#d9231b;background:#fff;font:inherit;font-size:12px;cursor:pointer}.selected-values .clear-button{margin-left:auto;border-color:transparent;color:#777}.sort-bar{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:8px;border:1px solid #ddd;background:#f1f1f1}.sort-options{display:flex}.sort-options button{height:30px;padding:0 16px;border:1px solid #ccc;border-right:0;color:#555;background:#fff;font:inherit;font-size:12px;cursor:pointer}.sort-options button:last-child{border-right:1px solid #ccc}.sort-options button.active{border-color:#e1251b;color:#fff;background:#e1251b}.result-count{color:#666;font-size:12px}.result-count b{color:#e1251b}.result-count span{margin-left:16px}.result-grid,.product-skeleton{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:16px}.product-item{min-width:0;padding:12px;border:1px solid transparent;background:#fff;cursor:pointer;transition:border-color .15s,box-shadow .15s}.product-item:hover,.product-item:focus-visible{border-color:#e1251b;box-shadow:0 5px 16px rgba(0,0,0,.09);outline:0}.product-image{position:relative;aspect-ratio:1;overflow:hidden;background:#f7f7f7}.product-image .el-image{width:100%;height:100%}.product-image>span{position:absolute;right:8px;bottom:8px;padding:3px 6px;color:#fff;background:#e1251b;font-size:10px}.image-placeholder{display:grid;width:100%;height:100%;place-items:center;color:#aaa;font-size:12px}.product-price{margin-top:12px;color:#e1251b;font-size:20px;font-weight:700}.product-price small{font-size:13px}.product-item h2{display:-webkit-box;height:42px;margin:7px 0 5px;overflow:hidden;color:#333;font-size:13px;font-weight:400;line-height:21px;-webkit-box-orient:vertical;-webkit-line-clamp:2}.product-item>p{margin:0;color:#999;font-size:11px}.product-item>p b{margin-right:5px;padding:1px 3px;color:#fff;background:#e1251b;font-weight:400}.product-item footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;color:#999;font-size:11px}.product-item footer button{padding:5px 9px;border:1px solid #ddd;color:#666;background:#fff;cursor:pointer}.product-item footer button:hover{border-color:#e1251b;color:#e1251b}.product-skeleton>.el-skeleton{padding:12px;background:#fff}.skeleton-image{width:100%;height:auto;aspect-ratio:1}.skeleton-text{width:90%;margin-top:14px}.skeleton-price{width:38%;margin-top:8px}.state-panel{display:grid;min-height:320px;place-items:center;align-content:center;margin-top:16px;border:1px solid #e5e5e5;background:#fff;text-align:center}.state-panel h2{margin:0;color:#444;font-size:18px}.state-panel p{margin:12px 0 22px;color:#999;font-size:13px}.result-pagination{justify-content:center;margin-top:30px}@media(max-width:900px){.result-grid,.product-skeleton{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:680px){.search-shell{max-width:100%}.breadcrumb{padding:0 14px}.result-search{align-items:flex-start;flex-direction:column;gap:9px;padding:14px}.result-search-box{max-width:100%;width:100%}.selector-row,.selected-row{grid-template-columns:76px 1fr}.selector-label{padding:13px 9px}.selector-values{max-height:136px;overflow:auto}.sort-bar{align-items:flex-start;flex-direction:column;gap:9px}.sort-options{width:100%}.sort-options button{min-width:0;flex:1;padding:0 5px}.result-count{align-self:flex-end}.result-grid,.product-skeleton{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.product-item{padding:8px}.result-pagination{overflow-x:auto;justify-content:flex-start;padding:0 10px}}
</style>
