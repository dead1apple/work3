<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { addFavorite, checkFavorite, getProductDetail, getProductReviews, removeFavorite } from '../../api/index.js'
import { useCartStore } from '../../store/cart.js'
import { useUserStore } from '../../store/user.js'
import { normalizeFavoriteState } from '../../utils/favorite.js'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const loading = ref(true)
const product = ref(null)
const selectedOptions = ref({})
const quantity = ref(1)
const activeTab = ref('detail')
const isFavorite = ref(false)
const favoriteLoading = ref(false)
const selectedSku = computed(() => {
  if (!product.value?.skuList?.length) return null
  return product.value.skuList.find((sku) => {
    try {
      const specs = JSON.parse(sku.specValues || '{}')
      return Object.entries(specs).every(([label, value]) => selectedOptions.value[label] === value)
    } catch {
      return false
    }
  }) || product.value.skuList[0]
})

const formatPrice = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const normalizeProduct = (payload) => {
  const raw = payload?.product || {}
  const skuList = payload?.skuList || []
  const optionMap = new Map()
  skuList.forEach((sku) => {
    try {
      Object.entries(JSON.parse(sku.specValues || '{}')).forEach(([label, value]) => {
        if (!optionMap.has(label)) optionMap.set(label, [])
        if (!optionMap.get(label).includes(value)) optionMap.get(label).push(value)
      })
    } catch {
      // 忽略格式异常的 SKU 规格，其他商品信息仍可正常展示。
    }
  })
  const prices = skuList.map((sku) => Number(sku.price)).filter(Number.isFinite)
  const marketPrices = skuList.map((sku) => Number(sku.marketPrice)).filter(Number.isFinite)
  return {
    id: raw.id,
    title: raw.name || '未命名商品',
    subtitle: raw.subtitle || '',
    price: prices.length ? Math.min(...prices) : 0,
    originalPrice: marketPrices.length ? Math.max(...marketPrices) : 0,
    sales: raw.salesCount || 0,
    reviewCount: 0,
    images: [raw.mainImage, ...(raw.images || [])].filter(Boolean),
    detail: raw.detail || '暂无商品详情描述。',
    options: Array.from(optionMap, ([label, values]) => ({ label, values })),
    skuList,
    reviews: [],
  }
}

const normalizeReview = (item) => ({
  name: item.user?.nickname || item.user?.username || item.nickname || item.username || '匿名用户',
  avatar: item.user?.avatar || item.avatar || 'https://i.pravatar.cc/80?img=12',
  content: item.content || item.comment || '用户未填写评价内容。',
  date: item.createTime || '',
})

const loadProduct = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id)
    if (!Number.isFinite(id)) throw new Error('invalid product id')
    const detailResult = await getProductDetail(id)
    product.value = normalizeProduct(detailResult)
    if (!product.value.id) throw new Error('product not found')
    product.value.options.forEach((option) => { selectedOptions.value[option.label] = option.values[0] })
    if (userStore.isLoggedIn) {
      try {
        isFavorite.value = normalizeFavoriteState(await checkFavorite(id))
      } catch { isFavorite.value = false }
    } else {
      isFavorite.value = false
    }

    try {
      const reviewResult = await getProductReviews(id, { page: 1, size: 10 })
      const reviews = Array.isArray(reviewResult) ? reviewResult : reviewResult?.list || []
      product.value.reviews = reviews.map(normalizeReview)
      product.value.reviewCount = reviewResult?.total ?? product.value.reviews.length
    } catch {
      // 评价接口失败不阻断商品详情展示。
    }
  } catch {
    ElMessage.error('商品不存在')
    router.replace('/home')
  } finally {
    loading.value = false
  }
}

const handleAddToCart = async () => {
  try {
    const sku = selectedSku.value
    await cartStore.addToCart({
      id: sku?.id || product.value?.id,
      skuId: sku?.id || product.value?.id,
      quantity: quantity.value,
      name: product.value?.title,
      image: sku?.image || product.value?.images?.[0],
      price: sku?.price || product.value?.price,
      skuName: sku?.skuName,
    })
    ElMessage.success('已加入购物车')
  } catch (error) {
    ElMessage.error(error.message || '加入购物车失败')
  }
}

const handleBuyNow = () => {
  const sku = selectedSku.value
  router.push({ path: '/checkout/buy-now', query: { productId: product.value.id, skuId: sku?.id || product.value.id, quantity: quantity.value } })
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('登录后即可收藏商品')
    await router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (favoriteLoading.value) return
  favoriteLoading.value = true
  try {
    if (isFavorite.value) await removeFavorite(product.value.id)
    else await addFavorite(product.value.id)
    isFavorite.value = !isFavorite.value
    ElMessage.success(isFavorite.value ? '已收藏' : '已取消收藏')
  } catch (error) {
    ElMessage.error(error.message || '收藏操作失败')
  } finally {
    favoriteLoading.value = false
  }
}

onMounted(loadProduct)
</script>

<template>
  <main class="detail-page">
    <el-skeleton v-if="loading" :rows="10" animated class="detail-skeleton" />
    <template v-else-if="product">
      <section class="product-overview">
        <div class="gallery-panel">
          <el-carousel height="min(560px, 58vw)" indicator-position="outside" arrow="always">
            <el-carousel-item v-for="(image, index) in product.images" :key="image">
              <div class="gallery-image-wrap"><img class="gallery-image" :src="image" :alt="`${product.title} 图片 ${index + 1}`" /></div>
            </el-carousel-item>
          </el-carousel>
        </div>
        <div class="info-panel">
          <span class="self-operated">真实商品 · 在线库存</span>
          <h1>{{ product.title }}</h1>
          <p class="product-subtitle">{{ product.subtitle }}</p>
          <div class="price-row"><span class="price-label">起售价</span><strong class="price"><small>￥</small>{{ formatPrice(product.price) }}</strong><del>￥{{ formatPrice(product.originalPrice) }}</del></div>
          <div class="sales-row">已售 {{ product.sales }} 件 <i></i> 评价 {{ product.reviewCount }}</div>
          <div class="divider"></div>
          <div v-for="option in product.options" :key="option.label" class="option-row">
            <span class="option-label">{{ option.label }}</span>
            <el-radio-group v-model="selectedOptions[option.label]" size="large"><el-radio-button v-for="value in option.values" :key="value" :value="value">{{ value }}</el-radio-button></el-radio-group>
          </div>
          <div class="option-row quantity-row"><span class="option-label">数量</span><el-input-number v-model="quantity" :min="1" :max="99" size="large" /><span class="stock-note">库存以接口返回为准</span></div>
          <el-row :gutter="12" class="action-row"><el-col :span="8"><el-button class="cart-button" type="primary" size="large" @click="handleAddToCart">加入购物车</el-button></el-col><el-col :span="8"><el-button class="buy-button" type="danger" size="large" @click="handleBuyNow">立即购买</el-button></el-col><el-col :span="8"><el-button class="favorite-button" :class="{ active: isFavorite }" size="large" :loading="favoriteLoading" :aria-pressed="isFavorite" @click="toggleFavorite"><span v-if="!favoriteLoading" aria-hidden="true">{{ isFavorite ? '♥' : '♡' }}</span>{{ isFavorite ? '已收藏' : '收藏商品' }}</el-button></el-col></el-row>
          <p class="service-note">支持 7 天无理由退货 · 京东物流 · 正品保障</p>
        </div>
      </section>
      <section class="detail-tabs-section">
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="商品详情" name="detail"><div class="detail-copy"><h2>商品详情</h2><p>{{ product.detail }}</p></div></el-tab-pane>
          <el-tab-pane :label="`用户评价（${product.reviewCount}）`" name="reviews">
            <el-empty v-if="!product.reviews.length" description="暂无评价" />
            <div v-else class="review-list"><article v-for="review in product.reviews" :key="`${review.name}-${review.date}`" class="review-item"><img class="review-avatar" :src="review.avatar" :alt="`${review.name}的头像`" /><div class="review-main"><div class="review-meta"><strong>{{ review.name }}</strong><time>{{ review.date }}</time></div><p>{{ review.content }}</p></div></article></div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </template>
  </main>
</template>

<style scoped>
.detail-page { padding-bottom: 32px; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; letter-spacing: 1px; }.detail-skeleton{padding:24px}.product-overview{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(390px,.98fr);gap:clamp(26px,5vw,68px);align-items:start;padding:24px;border:1px solid #edf0f3;border-radius:22px;background:#fff}.gallery-image-wrap{display:grid;height:100%;place-items:center;overflow:hidden;border-radius:16px;background:#f4f5f7}.gallery-image{width:100%;height:100%;object-fit:cover}.self-operated{display:inline-flex;padding:5px 8px;border-radius:5px;color:#e1251b;background:#fff0ee;font-size:11px;font-weight:800}.info-panel{padding:8px 4px 0}.info-panel h1{margin:15px 0 8px;color:#20242b;font-size:clamp(22px,3vw,32px);line-height:1.3;letter-spacing:-.04em}.product-subtitle{margin:0 0 24px;color:#8b95a5;font-size:13px}.price-row{display:flex;align-items:baseline;gap:12px;padding:15px 16px;border-radius:10px;background:#fff5f4}.price-label{color:#a75e59;font-size:12px}.price{color:#e1251b;font-size:clamp(30px,4vw,40px);line-height:1;letter-spacing:-.04em}.price small{margin-right:3px;font-size:18px}.price-row del{color:#a5abb5;font-size:12px}.sales-row{margin-top:12px;color:#9099a5;font-size:12px}.sales-row i{display:inline-block;width:1px;height:12px;margin:0 12px -2px;background:#dfe3e8}.divider{height:1px;margin:24px 0;background:#edf0f3}.option-row{display:flex;align-items:center;gap:18px;margin:16px 0}.option-label{flex:0 0 46px;color:#66717f;font-size:13px}.stock-note{color:#6d7885;font-size:12px}.action-row{margin-top:28px}.cart-button,.buy-button,.favorite-button{width:100%;border-radius:10px;font-weight:700}.favorite-button span{margin-right:5px;color:#e1251b;font-size:20px}.favorite-button.active{--el-button-bg-color:#fff2f0;--el-button-border-color:#e1251b;--el-button-text-color:#e1251b}.cart-button{--el-button-bg-color:#fff2f0;--el-button-border-color:#f5b0a9;--el-button-text-color:#d92218;--el-button-hover-bg-color:#ffe5e2;--el-button-hover-border-color:#e1251b;--el-button-hover-text-color:#c91c14}.service-note{margin:17px 0 0;color:#9aa3ae;font-size:11px}.detail-tabs-section{margin-top:28px;padding:0 24px 24px;border:1px solid #edf0f3;border-radius:22px;background:#fff}.detail-tabs :deep(.el-tabs__item){height:58px;color:#89919c;font-size:14px}.detail-tabs :deep(.el-tabs__item.is-active){color:#e1251b;font-weight:700}.detail-tabs :deep(.el-tabs__active-bar){background:#e1251b}.detail-copy{max-width:760px;padding:24px 0 12px}.detail-copy h2{margin:0 0 14px;color:#2c333d;font-size:20px}.detail-copy p{margin:0;color:#697482;font-size:14px;line-height:2}.review-list{padding:8px 0}.review-item{display:flex;gap:14px;padding:20px 0;border-bottom:1px solid #f0f2f4}.review-item:last-child{border-bottom:0}.review-avatar{width:42px;height:42px;flex:0 0 42px;border-radius:50%;object-fit:cover}.review-main{flex:1}.review-meta{display:flex;justify-content:space-between;gap:12px;color:#414955;font-size:13px}.review-meta time{color:#a0a8b2;font-size:11px}.review-main p{margin:8px 0 0;color:#697482;font-size:13px;line-height:1.8}:deep(.el-carousel__container){border-radius:16px}:deep(.el-carousel__button){width:18px;height:4px;border-radius:99px;background:#e1251b}
@media (max-width:800px){.product-overview{grid-template-columns:1fr;gap:26px;padding:16px}.gallery-image-wrap{min-height:min(78vw,480px)}.info-panel{padding:0}}@media (max-width:520px){.detail-tabs-section{padding:0 16px 18px}.option-row{align-items:flex-start;flex-direction:column;gap:8px}.option-label{flex-basis:auto}.price-row{gap:8px;padding:13px}.price{font-size:30px}}
</style>
