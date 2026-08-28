<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { addFavorite, checkFavorite, getProductDetail, getProductReviews, removeFavorite } from '../../api/index.js'
import { useCartStore } from '../../store/cart.js'
import { useUserStore } from '../../store/user.js'
import { normalizeFavoriteState } from '../../utils/favorite.js'
import { createRequestGenerationGate, findSkuBySelection, getInitialSkuSelection, isSkuOptionAvailable, normalizeProductDetail, normalizeProductImages } from '../../utils/productDetail.js'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const loading = ref(true)
const product = ref(null)
const selectedOptions = ref({})
const quantity = ref(1)
const activeSection = ref('detail')
const activeImageIndex = ref(0)
const reviewFilter = ref('all')
const isFavorite = ref(false)
const favoriteLoading = ref(false)
const loadGate = createRequestGenerationGate()

const placeholderImage = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="100%" height="100%" fill="#f5f6f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e1251b" font-family="Arial" font-size="48">JD SELECT</text></svg>')
const selectedSku = computed(() => product.value?.skuList?.length ? findSkuBySelection(product.value.skuList, selectedOptions.value) : null)
const maxQuantity = computed(() => Math.max(1, Math.min(99, selectedSku.value?.stock || 1)))
const displayPrice = computed(() => selectedSku.value?.price ?? product.value?.price ?? 0)
const displayOriginalPrice = computed(() => selectedSku.value?.marketPrice ?? product.value?.originalPrice ?? 0)
const displayStock = computed(() => selectedSku.value ? selectedSku.value.stock : 0)
const displayImages = computed(() => { const images = normalizeProductImages(selectedSku.value?.image, product.value?.images); return images.length ? images : [placeholderImage] })
const activeImage = computed(() => displayImages.value[activeImageIndex.value] || displayImages.value[0])
const selectedSummary = computed(() => Object.entries(selectedOptions.value).map(([label, value]) => `${label}：${value}`).join('，'))
const canBuySelectedSku = computed(() => Boolean(selectedSku.value && selectedSku.value.stock > 0))
const reviewCount = computed(() => Number(product.value?.reviewCount || 0))
const displayRating = computed(() => product.value?.rating || (reviewCount.value ? '4.9' : '暂无'))
const categoryLabel = computed(() => product.value?.category?.name || '商品分类')
const shopName = computed(() => product.value?.shop?.shopName || product.value?.shop?.name || '京东自营旗舰店')
const formatPrice = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const normalizeReview = (item) => {
  const review = item?.review || item || {}
  const user = item?.user || review.user || {}
  return {
    name: user.nickname || user.username || review.nickname || review.username || '匿名用户',
    avatar: user.avatar || review.avatar || placeholderImage,
    content: review.content || review.comment || '用户未填写评价内容。',
    date: review.createTime || '',
    rating: review.rating || review.score || 5,
    images: normalizeProductImages(review.images || review.imageUrls),
  }
}

const resetProductState = () => {
  product.value = null
  selectedOptions.value = {}
  quantity.value = 1
  activeSection.value = 'detail'
  activeImageIndex.value = 0
  reviewFilter.value = 'all'
  isFavorite.value = false
  favoriteLoading.value = false
}

const loadProduct = async (routeProductId) => {
  const generation = loadGate.next()
  resetProductState()
  loading.value = true
  try {
    const id = Number(routeProductId)
    if (!Number.isFinite(id)) throw new Error('invalid product id')
    const detailResult = await getProductDetail(id)
    if (!generation.isCurrent()) return
    const nextProduct = normalizeProductDetail(detailResult)
    if (!nextProduct.id) throw new Error('product not found')
    generation.commit(() => {
      product.value = nextProduct
      selectedOptions.value = getInitialSkuSelection(nextProduct.skuList)
    })
    if (userStore.isLoggedIn) {
      try {
        const favoriteResult = await checkFavorite(id)
        if (!generation.commit(() => { isFavorite.value = normalizeFavoriteState(favoriteResult) })) return
      } catch {
        if (!generation.commit(() => { isFavorite.value = false })) return
      }
    }
    try {
      const reviewResult = await getProductReviews(id, { page: 1, size: 10 })
      if (!generation.isCurrent()) return
      const reviews = Array.isArray(reviewResult) ? reviewResult : reviewResult?.list || []
      generation.commit(() => {
        product.value.reviews = reviews.map(normalizeReview)
        product.value.reviewCount = reviewResult?.total ?? product.value.reviews.length
      })
    } catch {
      if (!generation.isCurrent()) return
    }
  } catch {
    if (!generation.isCurrent()) return
    ElMessage.error('商品不存在')
    router.replace('/home')
  } finally {
    generation.commit(() => { loading.value = false })
  }
}

const handleAddToCart = async () => {
  const sku = selectedSku.value
  if (!sku) return ElMessage.warning('当前规格组合不可购买，请重新选择')
  if (sku.stock <= 0) return ElMessage.warning('当前规格暂时无货')
  try {
    await cartStore.addToCart({ id: sku.id, skuId: sku.id, quantity: quantity.value, name: product.value?.title, image: sku.image || product.value?.images?.[0], price: sku.price, skuName: sku.skuName })
    ElMessage.success('已加入购物车')
  } catch (error) {
    ElMessage.error(error.message || '加入购物车失败')
  }
}

const handleBuyNow = () => {
  const sku = selectedSku.value
  if (!sku) return ElMessage.warning('当前规格组合不可购买，请重新选择')
  if (sku.stock <= 0) return ElMessage.warning('当前规格暂时无货')
  router.push({ path: '/checkout/buy-now', query: { productId: product.value.id, skuId: sku.id, quantity: quantity.value } })
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

const scrollToSection = (section) => {
  activeSection.value = section
  document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(selectedSku, () => {
  quantity.value = Math.min(quantity.value, maxQuantity.value)
  activeImageIndex.value = 0
})
watch(() => route.params.id, loadProduct, { immediate: true })
</script>

<template>
  <main class="detail-page">
    <el-skeleton v-if="loading" :rows="10" animated class="detail-skeleton" />
    <template v-else-if="product">
      <nav class="breadcrumb" aria-label="面包屑导航">
        <RouterLink to="/home">首页</RouterLink><span>/</span><RouterLink to="/products">{{ categoryLabel }}</RouterLink><span>/</span><span>{{ product.title }}</span>
      </nav>

      <section class="product-overview" aria-label="商品首屏">
        <div class="gallery-panel">
          <div class="main-image-wrap"><img class="main-image" :src="activeImage" :alt="`${product.title} 商品图片`" /><span class="zoom-tip">⌕ 悬停查看细节</span></div>
          <div class="thumbnail-list" role="list" aria-label="商品图片">
            <button v-for="(image, index) in displayImages" :key="`${image}-${index}`" class="thumbnail" :class="{ active: activeImageIndex === index }" type="button" :aria-label="`查看第${index + 1}张图片`" @click="activeImageIndex = index"><img :src="image" :alt="`${product.title} 图片 ${index + 1}`" /></button>
          </div>
          <div class="gallery-meta"><span>商品 ID：{{ product.id }} · 共 {{ displayImages.length }} 张图片</span><span>分享商品　举报</span></div>
        </div>

        <div class="info-panel">
          <div class="badges"><span class="badge badge-dark">京东自营</span><span class="badge">品质保障</span><span class="badge">分期免息</span></div>
          <h1>{{ product.title }}</h1>
          <p class="product-subtitle">{{ product.subtitle || '精选品质商品，清晰的订单与配送体验。' }}</p>
          <div class="rating-line"><span class="rating-stars">★★★★★ <strong>{{ displayRating }}</strong></span><button class="rating-link" type="button" @click="scrollToSection('reviews')">好评率 98%　{{ reviewCount || '暂无' }} 条评价</button><span>已售 {{ product.sales || 0 }} 件</span></div>
          <div class="price-box"><span class="price-label">京东价</span><strong class="price"><small>￥</small>{{ formatPrice(displayPrice) }}</strong><del v-if="displayOriginalPrice">￥{{ formatPrice(displayOriginalPrice) }}</del></div>
          <div class="promo-row"><span class="row-label">促销</span><span class="coupon"><b>满减</b> 满 3000 减 200 <button type="button" @click="ElMessage.info('优惠券功能待接入活动接口')">领取优惠券</button></span></div>
          <div class="delivery-row"><span class="row-label">配送</span><div><strong class="in-stock">{{ displayStock > 0 ? '现货' : '暂时无货' }}</strong><span class="delivery-place">　北京朝阳区　预计明天送达</span><small>由京东发货 · 免运费 · 支持 7 天无理由退货</small></div></div>

          <div class="sku-area">
            <div v-for="option in product.options" :key="option.label" class="option-row"><span class="option-label">{{ option.label }}</span><el-radio-group v-model="selectedOptions[option.label]" class="sku-options" size="large"><el-radio-button v-for="value in option.values" :key="value" :value="value" :disabled="!isSkuOptionAvailable(product.skuList, selectedOptions, option.label, value)">{{ value }}</el-radio-button></el-radio-group></div>
            <p class="selected-summary">已选：{{ selectedSummary || '请选择商品规格' }}</p>
            <div class="quantity-row"><span class="option-label">数量</span><el-input-number v-model="quantity" :min="1" :max="maxQuantity" size="large" /><span class="stock-note">库存 {{ displayStock }} 件</span></div>
          </div>
          <div class="action-row"><el-button class="cart-button" type="primary" size="large" :aria-disabled="!canBuySelectedSku" @click="handleAddToCart">加入购物车</el-button><el-button class="buy-button" type="danger" size="large" :aria-disabled="!canBuySelectedSku" @click="handleBuyNow">立即购买</el-button><button class="favorite-button" :class="{ active: isFavorite }" type="button" :aria-label="isFavorite ? '取消收藏商品' : '收藏商品'" :aria-pressed="isFavorite" :disabled="favoriteLoading" @click="toggleFavorite">{{ isFavorite ? '♥' : '♡' }}</button></div>
        </div>
      </section>

      <section class="service-strip" aria-label="服务承诺"><div class="service-item"><span class="service-icon">✓</span><span><strong>正品保障</strong><small>严格质检，放心购买</small></span></div><div class="service-item"><span class="service-icon">↗</span><span><strong>京东物流</strong><small>仓配一体，准时送达</small></span></div><div class="service-item"><span class="service-icon">↩</span><span><strong>无忧退货</strong><small>7 天无理由退货</small></span></div><div class="service-item"><span class="service-icon">◷</span><span><strong>极速退款</strong><small>售后审核快一步</small></span></div></section>

      <nav class="detail-anchor" aria-label="商品信息导航"><button v-for="item in [{ id: 'detail', label: '商品介绍' }, { id: 'specs', label: '规格参数' }, { id: 'package', label: '包装清单' }, { id: 'reviews', label: `用户评价（${reviewCount}）` }, { id: 'after-sale', label: '售后保障' }]" :key="item.id" type="button" :class="{ active: activeSection === item.id }" @click="scrollToSection(item.id)">{{ item.label }}</button></nav>

      <div class="content-layout">
        <div class="content-main">
          <section id="detail" class="content-section"><div class="section-title"><h2>商品介绍</h2><span>来自 product.detail 商品详情字段</span></div><div class="selling-points"><div class="point"><strong>品质商品</strong><span>严格筛选，真实可靠的商品信息。</span></div><div class="point"><strong>快速送达</strong><span>京东物流协同仓配，订单状态可追踪。</span></div><div class="point"><strong>售后无忧</strong><span>明确的退换货规则，购买更安心。</span></div></div><div class="detail-copy"><p>{{ product.detail || '暂无商品详情描述。' }}</p></div></section>
          <section id="specs" class="content-section"><div class="section-title"><h2>规格参数</h2><span>来自 product 与 skuList 字段</span></div><table class="spec-table"><tbody><tr><th>商品名称</th><td>{{ product.title }}</td><th>商品 ID</th><td>{{ product.id }}</td></tr><tr><th>当前 SKU</th><td>{{ selectedSku?.skuName || '请选择规格' }}</td><th>SKU ID</th><td>{{ selectedSku?.id || '—' }}</td></tr><tr><th>商品状态</th><td>{{ product.status === 0 ? '已下架' : product.status === 2 ? '待审核' : '上架中' }}</td><th>所属店铺</th><td>{{ shopName }}（shopId: {{ product.shopId || '—' }}）</td></tr><tr><th>重量</th><td>{{ selectedSku?.weight ? `${selectedSku.weight} kg` : '—' }}</td><th>累计销量</th><td>{{ product.sales || 0 }} 件</td></tr></tbody></table></section>
          <section id="package" class="content-section"><div class="section-title"><h2>包装清单</h2><span>建议作为结构化内容维护</span></div><table class="spec-table"><tbody><tr><th>主机</th><td>{{ product.title }} × 1</td></tr><tr><th>配件</th><td>产品配件、数据线、说明书、取卡针</td></tr><tr><th>服务</th><td>保修凭证、电子说明书、京东售后服务</td></tr></tbody></table></section>
          <section id="reviews" class="content-section"><div class="section-title"><h2>用户评价</h2><span>GET /products/{{ product.id }}/reviews?page=1&amp;size=10</span></div><div class="review-summary"><div class="score">{{ displayRating }}<small>综合评分</small></div><div class="rating-bars"><div><span>5 星</span><i><b style="width: 93%"></b></i><em>93%</em></div><div><span>4 星</span><i><b style="width: 5%"></b></i><em>5%</em></div><div><span>3 星</span><i><b style="width: 2%"></b></i><em>2%</em></div></div></div><div class="review-filters"><button v-for="filter in [{ id: 'all', label: `全部（${reviewCount}）` }, { id: 'image', label: '有图' }, { id: 'follow', label: '追评' }]" :key="filter.id" type="button" :class="{ active: reviewFilter === filter.id }" @click="reviewFilter = filter.id">{{ filter.label }}</button></div><el-empty v-if="!product.reviews?.length" description="暂无评价" /><div v-else class="review-list"><article v-for="review in product.reviews" :key="`${review.name}-${review.date}`" class="review-item"><img class="review-avatar" :src="review.avatar" :alt="`${review.name}的头像`" /><div class="review-main"><div class="review-meta"><strong>{{ review.name }}</strong><time>{{ review.date }}</time></div><div class="review-stars">★★★★★</div><p>{{ review.content }}</p><div v-if="review.images?.length" class="review-images"><img v-for="image in review.images" :key="image" :src="image" alt="评价图片" /></div></div></article></div></section>
          <section id="after-sale" class="content-section"><div class="section-title"><h2>售后保障</h2><span>Service · 服务承诺</span></div><table class="spec-table"><tbody><tr><th>退货政策</th><td>签收后 7 天内，在不影响二次销售的情况下支持无理由退货。</td></tr><tr><th>质量问题</th><td>商品质量问题提供换新或维修服务，具体以售后审核为准。</td></tr><tr><th>客服支持</th><td>在线客服 09:00–22:00，订单和物流状态可追踪。</td></tr></tbody></table></section>
        </div>
        <aside class="detail-side"><section class="side-block"><div class="shop-heading"><span class="shop-logo">JD</span><span><strong>{{ shopName }}</strong><small>品质服务 · 官方直营</small></span></div><div class="shop-score"><span>店铺评分 <b>4.9</b></span><span>全部商品</span></div><button type="button" @click="ElMessage.info('店铺入口待接入店铺详情页')">进入店铺　›</button><button type="button" @click="ElMessage.info('客服入口待接入在线客服')">联系客服　›</button></section><section class="side-block"><h2>看了又看</h2><div class="recommend-list"><div class="recommend-item"><span class="recommend-image">JD</span><span><strong>同系列配件</strong><b>￥99.00</b></span></div><div class="recommend-item"><span class="recommend-image">JD</span><span><strong>无线降噪耳机</strong><b>￥399.00</b></span></div><div class="recommend-item"><span class="recommend-image">JD</span><span><strong>轻薄平板电脑</strong><b>￥2,099.00</b></span></div></div></section></aside>
      </div>
    </template>
    <div v-if="product" class="mobile-purchase-bar"><button class="mobile-favorite" type="button" :aria-label="isFavorite ? '取消收藏商品' : '收藏商品'" @click="toggleFavorite">{{ isFavorite ? '♥' : '♡' }}</button><el-button class="mobile-cart" type="primary" :aria-disabled="!canBuySelectedSku" @click="handleAddToCart">加入购物车</el-button><el-button class="mobile-buy" type="danger" :aria-disabled="!canBuySelectedSku" @click="handleBuyNow">立即购买</el-button></div>
  </main>
</template>

<style scoped>
.detail-page { padding-bottom: 40px; color: #1f2933; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0; }
.detail-skeleton { padding: 24px; background: #fff; }
.breadcrumb { display: flex; gap: 8px; align-items: center; margin: 0 0 16px; color: #8c96a1; font-size: 12px; }
.breadcrumb a { color: #65717d; text-decoration: none; }
.breadcrumb a:hover { color: #e1251b; }
.product-overview { display: grid; grid-template-columns: minmax(0, 1.03fr) minmax(390px, .97fr); gap: clamp(30px, 4vw, 56px); padding: 26px; background: #fff; border: 1px solid #e9edf1; box-shadow: 0 14px 40px rgba(31,41,51,.05); }
.gallery-panel { min-width: 0; }
.main-image-wrap { position: relative; display: grid; place-items: center; height: min(490px, 44vw); min-height: 380px; overflow: hidden; background: #f7f8f9; }
.main-image { width: 100%; height: 100%; object-fit: contain; transition: transform .25s ease; }
.main-image-wrap:hover .main-image { transform: scale(1.04); }
.zoom-tip { position: absolute; right: 14px; bottom: 14px; padding: 6px 10px; color: #63707c; background: rgba(255,255,255,.92); border: 1px solid #e9edf1; font-size: 11px; }
.thumbnail-list { display: flex; gap: 10px; margin-top: 14px; overflow-x: auto; }
.thumbnail { width: 68px; height: 68px; flex: 0 0 68px; padding: 3px; background: #fff; border: 1px solid #dfe4e8; }
.thumbnail.active { padding: 2px; border: 2px solid #e1251b; }
.thumbnail img { width: 100%; height: 100%; object-fit: contain; }
.gallery-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 12px; color: #9ba4ad; font-size: 11px; }
.info-panel { min-width: 0; padding-top: 2px; }
.badges { display: flex; gap: 8px; align-items: center; }
.badge { padding: 4px 7px; color: #e1251b; background: #fff1ef; border-radius: 3px; font-size: 11px; font-weight: 700; }
.badge-dark { color: #fff; background: #343b44; }
.info-panel h1 { margin: 15px 0 8px; color: #20242b; font-size: clamp(22px, 2.5vw, 28px); line-height: 1.4; }
.product-subtitle { margin: 0 0 17px; color: #7f8a96; font-size: 13px; line-height: 1.7; }
.rating-line { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid #e9edf1; color: #8b96a0; font-size: 12px; }
.rating-stars { color: #f08b2f; font-size: 15px; letter-spacing: 1px; }
.rating-stars strong { margin-left: 4px; font-size: 13px; letter-spacing: 0; }
.rating-link { padding: 0; color: #e1251b; border: 0; background: transparent; font-size: 12px; }
.price-box { display: flex; align-items: baseline; gap: 12px; margin-top: 17px; padding: 15px 16px; background: #fff1ef; }
.price-label { color: #a35b56; font-size: 12px; }
.price { color: #e1251b; font-size: clamp(30px, 3.5vw, 40px); line-height: 1; }
.price small { margin-right: 3px; font-size: 18px; }
.price-box del { color: #a3abb4; font-size: 12px; }
.promo-row, .delivery-row { display: flex; align-items: flex-start; min-height: 40px; padding: 12px 0 2px; font-size: 12px; }
.row-label { flex: 0 0 58px; color: #87919c; }
.coupon { color: #586571; }
.coupon b { margin-right: 8px; padding: 3px 7px; color: #fff; background: #e1251b; font-size: 11px; }
.coupon button { padding: 0; color: #e1251b; border: 0; background: transparent; font-size: 12px; }
.delivery-row { border-top: 1px dashed #edf0f3; }
.in-stock { color: #e1251b; }
.delivery-place { color: #4d5965; }
.delivery-row small { display: block; margin-top: 5px; color: #929ca6; font-size: 11px; }
.sku-area { margin-top: 14px; padding-top: 6px; border-top: 1px solid #e9edf1; }
.option-row { display: flex; align-items: center; gap: 14px; margin: 15px 0; }
.option-label { flex: 0 0 50px; color: #697582; font-size: 12px; }
.sku-options { display: flex; flex-wrap: wrap; gap: 8px; }
.sku-options :deep(.el-radio-button__inner) { min-width: 74px; padding: 9px 12px; color: #586571; background: #fff; border: 1px solid #cfd6dd; border-radius: 3px; box-shadow: none; font-size: 12px; }
.sku-options :deep(.el-radio-button:first-child .el-radio-button__inner), .sku-options :deep(.el-radio-button:last-child .el-radio-button__inner) { border-radius: 3px; }
.sku-options :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { color: #e1251b; background: #fff8f7; border-color: #e1251b; box-shadow: none; }
.sku-options :deep(.el-radio-button.is-disabled .el-radio-button__inner) { color: #bcc3ca; background: #f7f8f9; border-color: #e7eaed; }
.selected-summary { margin: 4px 0 0 64px; color: #8b96a0; font-size: 11px; }
.quantity-row { display: flex; align-items: center; gap: 14px; margin-top: 17px; }
.stock-note { color: #8a949e; font-size: 11px; }
.action-row { display: grid; grid-template-columns: 1.15fr 1fr 44px; gap: 10px; margin-top: 23px; }
.action-row .el-button { width: 100%; height: 44px; margin: 0; border-radius: 4px; font-weight: 700; }
.cart-button { --el-button-bg-color: #fff3f1; --el-button-border-color: #f0aaa4; --el-button-text-color: #e1251b; --el-button-hover-bg-color: #ffe9e6; --el-button-hover-border-color: #e1251b; }
.buy-button { --el-button-bg-color: #e1251b; --el-button-border-color: #e1251b; --el-button-hover-bg-color: #c81e16; --el-button-hover-border-color: #c81e16; }
.favorite-button { height: 44px; color: #707b86; border: 1px solid #d7dde2; border-radius: 4px; background: #fff; font-size: 22px; }
.favorite-button.active { color: #e1251b; border-color: #efb0aa; background: #fff1ef; }
.service-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; padding: 15px 18px; background: #fff; border: 1px solid #e9edf1; }
.service-item { display: flex; gap: 9px; align-items: center; color: #596572; font-size: 12px; }
.service-icon { display: grid; place-items: center; width: 26px; height: 26px; flex: 0 0 26px; color: #e1251b; border: 1px solid #f4b9b4; border-radius: 50%; }
.service-item strong, .service-item small { display: block; }
.service-item small { margin-top: 4px; color: #9aa3ad; font-size: 10px; }
.detail-anchor { position: sticky; top: 72px; z-index: 5; display: flex; gap: 30px; align-items: center; height: 58px; margin-top: 28px; padding: 0 22px; background: rgba(255,255,255,.97); border: 1px solid #e9edf1; box-shadow: 0 5px 14px rgba(31,41,51,.04); }
.detail-anchor button { position: relative; height: 100%; padding: 0; color: #65717d; border: 0; background: transparent; font-size: 14px; white-space: nowrap; }
.detail-anchor button.active, .detail-anchor button:hover { color: #e1251b; font-weight: 700; }
.detail-anchor button.active::after { position: absolute; right: 0; bottom: -1px; left: 0; height: 2px; background: #e1251b; content: ''; }
.content-layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 20px; margin-top: 20px; }
.content-section { scroll-margin-top: 140px; padding: 26px 30px; background: #fff; border: 1px solid #e9edf1; }
.content-section + .content-section { margin-top: 16px; }
.section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 15px; margin-bottom: 22px; padding-bottom: 14px; border-bottom: 1px solid #e9edf1; }
.section-title h2 { margin: 0; color: #2b333c; font-size: 19px; }
.section-title span { color: #9ca5ae; font-size: 11px; }
.selling-points { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.point { padding: 15px; background: #fafbfc; border-left: 3px solid #e1251b; }
.point strong, .point span { display: block; }
.point strong { margin-bottom: 6px; font-size: 13px; }
.point span { color: #87919c; font-size: 11px; line-height: 1.6; }
.detail-copy { color: #66727d; font-size: 14px; line-height: 1.9; }
.detail-copy :deep(img) { display: block; max-width: 100%; height: auto; margin: 14px auto; }
.detail-copy :deep(p) { margin: 0 0 12px; }
.spec-table { width: 100%; border-collapse: collapse; color: #4d5965; font-size: 12px; }
.spec-table th, .spec-table td { padding: 12px 14px; text-align: left; border: 1px solid #e9edf1; }
.spec-table th { width: 118px; color: #687580; background: #fafbfc; font-weight: 500; }
.review-summary { display: grid; grid-template-columns: 150px 1fr; gap: 25px; align-items: center; padding: 18px 20px; background: #fff9f8; }
.score { color: #e1251b; font-size: 42px; font-weight: 800; line-height: 1; text-align: center; }
.score small { display: block; margin-top: 8px; color: #9b8a87; font-size: 11px; font-weight: 400; }
.rating-bars > div { display: grid; grid-template-columns: 42px 1fr 38px; gap: 8px; align-items: center; margin: 7px 0; color: #89939d; font-size: 11px; }
.rating-bars i { height: 6px; overflow: hidden; background: #f0d9d6; }
.rating-bars b { display: block; height: 100%; background: #e1251b; }
.rating-bars em { font-style: normal; }
.review-filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 4px; }
.review-filters button { padding: 7px 13px; color: #687580; border: 1px solid #dfe4e8; border-radius: 3px; background: #fff; font-size: 11px; }
.review-filters button.active { color: #e1251b; border-color: #efb0aa; background: #fff1ef; }
.review-item { display: flex; gap: 13px; padding: 20px 0; border-bottom: 1px solid #e9edf1; }
.review-avatar { width: 38px; height: 38px; flex: 0 0 38px; border-radius: 50%; object-fit: cover; }
.review-main { flex: 1; min-width: 0; }
.review-meta { display: flex; justify-content: space-between; gap: 12px; color: #4a5662; font-size: 12px; }
.review-meta time { color: #a1a9b2; font-size: 11px; }
.review-stars { margin: 7px 0; color: #f08b2f; font-size: 12px; letter-spacing: 1px; }
.review-main p { margin: 0; color: #697580; font-size: 12px; line-height: 1.8; }
.review-images { display: flex; gap: 8px; margin-top: 10px; }
.review-images img { width: 66px; height: 66px; object-fit: cover; }
.detail-side { align-self: start; position: sticky; top: 150px; }
.side-block { padding: 20px; background: #fff; border: 1px solid #e9edf1; }
.side-block + .side-block { margin-top: 14px; }
.shop-heading { display: flex; gap: 10px; align-items: center; padding-bottom: 14px; border-bottom: 1px solid #e9edf1; }
.shop-logo { display: grid; place-items: center; width: 38px; height: 38px; color: #fff; background: #252b33; border-radius: 50%; font-size: 13px; font-weight: 800; }
.shop-heading strong, .shop-heading small { display: block; }
.shop-heading strong { font-size: 13px; }
.shop-heading small { margin-top: 4px; color: #a0a8b2; font-size: 10px; }
.shop-score { display: flex; justify-content: space-between; margin: 16px 0; color: #7d8892; font-size: 11px; }
.shop-score b { color: #e1251b; }
.side-block > button { display: block; width: 100%; padding: 10px 0; color: #687580; border: 0; border-top: 1px solid #f0f2f4; background: transparent; text-align: left; font-size: 12px; }
.side-block > button:hover { color: #e1251b; }
.side-block h2 { margin: 0 0 16px; font-size: 15px; }
.recommend-list { display: grid; gap: 14px; }
.recommend-item { display: grid; grid-template-columns: 58px 1fr; gap: 9px; align-items: center; }
.recommend-image { display: grid; place-items: center; width: 58px; height: 58px; color: #e1251b; background: #f7f8f9; font-size: 11px; font-weight: 800; }
.recommend-item strong, .recommend-item b { display: block; }
.recommend-item strong { color: #5e6a75; font-size: 11px; line-height: 1.4; }
.recommend-item b { margin-top: 5px; color: #e1251b; font-size: 12px; }
.mobile-purchase-bar { display: none; }
@media (max-width: 900px) { .product-overview { grid-template-columns: 1fr; gap: 26px; }.main-image-wrap { height: min(78vw, 470px); }.content-layout { grid-template-columns: 1fr; }.detail-side { position: static; } }
@media (max-width: 640px) { .detail-page { padding-bottom: 78px; }.breadcrumb { padding: 0 12px; white-space: nowrap; overflow: hidden; }.product-overview { padding: 16px 12px; border-right: 0; border-left: 0; box-shadow: none; }.main-image-wrap { min-height: 300px; }.info-panel h1 { font-size: 22px; }.service-strip { grid-template-columns: repeat(2, 1fr); margin: 12px; padding: 14px; }.detail-anchor { top: 112px; gap: 22px; margin-top: 16px; overflow-x: auto; white-space: nowrap; }.content-layout { margin-top: 12px; }.content-section { padding: 20px 16px; border-right: 0; border-left: 0; }.selling-points { grid-template-columns: 1fr; }.option-row { align-items: flex-start; flex-direction: column; gap: 8px; }.selected-summary { margin-left: 0; }.review-summary { grid-template-columns: 105px 1fr; gap: 10px; padding: 14px; }.score { font-size: 33px; }.mobile-purchase-bar { position: fixed; right: 0; bottom: 0; left: 0; z-index: 8; display: grid; grid-template-columns: 46px 1fr 1fr; gap: 8px; padding: 10px 12px; border-top: 1px solid #e9edf1; background: rgba(255,255,255,.97); box-shadow: 0 -4px 16px rgba(31,41,51,.08); }.mobile-purchase-bar .el-button { height: 40px; margin: 0; border-radius: 3px; font-size: 12px; font-weight: 700; }.mobile-favorite { color: #e1251b; border: 1px solid #efb0aa; border-radius: 3px; background: #fff1ef; font-size: 19px; }.mobile-cart { --el-button-bg-color: #fff3f1; --el-button-border-color: #f0aaa4; --el-button-text-color: #e1251b; }.mobile-buy { --el-button-bg-color: #e1251b; --el-button-border-color: #e1251b; } }
</style>
