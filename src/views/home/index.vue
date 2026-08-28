<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ArrowRight, Cellphone, Collection, Dish, Goods, Headset, Iphone, Location, Monitor,
  Notebook, Refrigerator, ShoppingBag, ShoppingCart, Star, Ticket, UserFilled,
  Van, Wallet, Watch, WindPower,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user.js'
import {
  claimCoupon,
  getAvailableCoupons,
  getBrands,
  getCartList,
  getCategoryTree,
  getFavorites,
  getMyCoupons,
  getOrders,
  getProductList,
} from '../../api/index.js'
import { readPayloadList, unwrapData } from '../../utils/response.js'
import { buildCategoryProductsRoute, normalizeCategoryTree, resolveFeaturedCategoryVisual, selectFeaturedCategories } from '../../utils/category.js'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const categoryLoading = ref(true)
const dashboardLoading = ref(false)
const productList = ref([])
const categoryList = ref([])
const brandList = ref([])
const couponList = ref([])
const availableCouponList = ref([])
const accountSummary = ref({ cartCount: 0, cartPrice: 0, favoriteCount: 0, couponCount: 0, orders: {} })
const claimingCouponId = ref(null)

const categoryIcons = { Cellphone, Dish, Goods, Headset, Iphone, Monitor, Notebook, Refrigerator, Watch, WindPower }

const orderDefinitions = [
  { status: 0, label: '待付款', icon: Wallet, tone: 'red' },
  { status: 1, label: '待发货', icon: ShoppingBag, tone: 'orange' },
  { status: 2, label: '待收货', icon: Van, tone: 'blue' },
  { status: 3, label: '已完成', icon: Star, tone: 'green' },
]

const campaignCopy = [
  { eyebrow: '今日精选', title: '把喜欢的日子，过得更好', description: '精选好物限时上新，每天都有新发现' },
  { eyebrow: '生活焕新', title: '从一件好物开始', description: '为日常挑选实用、耐看、值得的好东西' },
  { eyebrow: '品质优选', title: '认真生活，认真选择', description: '精选商品与品牌，陪你把生活过得更有质感' },
  { eyebrow: '本周推荐', title: '现在就去发现', description: '逛逛大家都在关注的热门商品' },
]

const isLoggedIn = computed(() => userStore.isLoggedIn)
const displayName = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '新朋友')
const firstName = computed(() => displayName.value.length > 8 ? `${displayName.value.slice(0, 8)}...` : displayName.value)
const bannerList = computed(() => productList.value.slice(0, 4).map((product, index) => ({ ...product, ...campaignCopy[index % campaignCopy.length] })))
const orderSummary = computed(() => orderDefinitions.map((item) => ({ ...item, count: accountSummary.value.orders[item.status] || 0 })))

const formatPrice = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const normalizeProduct = (item) => {
  const product = item?.product || item || {}
  return {
    id: product.id,
    title: product.name || product.title || '未命名商品',
    subtitle: product.subtitle || '精选好物，品质生活',
    price: formatPrice(item?.minPrice ?? product.minPrice ?? product.price),
    tag: product.status === 1 ? '在售' : '精选',
    image: product.mainImage || product.images?.[0] || '',
  }
}

const normalizeCoupon = (item) => {
  const coupon = item?.couponTemplate || item?.template || item || {}
  return {
    id: coupon.templateId || coupon.id || item?.templateId || item?.id,
    name: coupon.name || coupon.title || '平台优惠券',
    amount: coupon.amount ?? coupon.discountAmount ?? coupon.discountValue ?? coupon.value ?? 0,
    threshold: coupon.minAmount ?? coupon.minOrderAmount ?? coupon.threshold ?? 0,
    endTime: coupon.endTime || coupon.expireTime || coupon.validTo || '',
  }
}

const normalizeBrand = (item) => ({ id: item?.id, name: item?.name || item?.brandName || '品牌精选', logo: item?.logo || item?.logoUrl || '' })
const readTotal = (payload, fallback = 0) => {
  const source = unwrapData(payload)
  const total = source?.total ?? source?.totalElements ?? source?.count
  return Number.isFinite(Number(total)) ? Number(total) : fallback
}
const readSettled = (result, fallback) => result.status === 'fulfilled' ? result.value : fallback

const loadProducts = async () => {
  loading.value = true
  try {
    const result = await getProductList({ page: 1, size: 16 })
    productList.value = readPayloadList(result).map(normalizeProduct).filter((product) => product.id)
  } catch (error) {
    productList.value = []
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  categoryLoading.value = true
  try {
    categoryList.value = selectFeaturedCategories(normalizeCategoryTree(await getCategoryTree()), 10)
  } catch (error) {
    categoryList.value = []
  } finally {
    categoryLoading.value = false
  }
}

const loadBrands = async () => {
  try {
    brandList.value = readPayloadList(await getBrands()).map(normalizeBrand).filter((brand) => brand.id).slice(0, 6)
  } catch (error) {
    brandList.value = []
  }
}

const loadAccountSummary = async () => {
  if (!isLoggedIn.value) return
  dashboardLoading.value = true
  const orderRequests = orderDefinitions.map((item) => getOrders({ status: item.status, page: 1, size: 1 }))
  const [cartResult, favoriteResult, couponResult, availableCouponResult, ...orderResults] = await Promise.allSettled([
    getCartList(),
    getFavorites(),
    getMyCoupons({ status: 0 }),
    getAvailableCoupons(),
    ...orderRequests,
  ])
  const cartItems = readPayloadList(readSettled(cartResult, []))
  const favoriteItems = readPayloadList(readSettled(favoriteResult, []))
  const coupons = readPayloadList(readSettled(couponResult, []))
  const availableCoupons = readPayloadList(readSettled(availableCouponResult, []))
  const cartCount = cartItems.reduce((total, item) => total + Number(item.quantity ?? item.buyCount ?? item.num ?? 1), 0)
  const cartPrice = cartItems.reduce((total, item) => total + Number(item.totalPrice ?? (item.price * (item.quantity || 1)) ?? 0), 0)
  const orders = {}
  orderResults.forEach((result, index) => {
    const fallback = readPayloadList(readSettled(result, [])).length
    orders[orderDefinitions[index].status] = readTotal(readSettled(result, []), fallback)
  })
  accountSummary.value = { cartCount, cartPrice, favoriteCount: favoriteItems.length, couponCount: coupons.length, orders }
  couponList.value = coupons.map(normalizeCoupon).filter((coupon) => coupon.id).slice(0, 2)
  availableCouponList.value = availableCoupons.map(normalizeCoupon).filter((coupon) => coupon.id).slice(0, 2)
  dashboardLoading.value = false
}

const goDetail = (productId) => router.push(`/product/${productId}`)
const goCategory = (categoryId) => router.push(buildCategoryProductsRoute(categoryId))
const goProducts = () => router.push('/products')
const goRoute = (route) => router.push(route)

const claimAvailableCoupon = async (coupon) => {
  if (!coupon.id || claimingCouponId.value) return
  claimingCouponId.value = coupon.id
  try {
    await claimCoupon(coupon.id)
    ElMessage.success('优惠券领取成功')
    availableCouponList.value = availableCouponList.value.filter((item) => item.id !== coupon.id)
    accountSummary.value.couponCount += 1
  } catch (error) {
    ElMessage.error(error.message || '优惠券领取失败')
  } finally {
    claimingCouponId.value = null
  }
}

onMounted(() => {
  Promise.allSettled([loadProducts(), loadCategories(), loadBrands(), loadAccountSummary()])
})
</script>

<template>
  <div class="home-page">
    <el-skeleton v-if="loading" :rows="10" animated class="home-skeleton" />
    <template v-else>
      <section class="hero-section" aria-label="商城精选">
        <div class="hero-main">
          <el-carousel v-if="bannerList.length" height="clamp(340px, 32vw, 430px)" :interval="4500" arrow="always" indicator-position="outside">
            <el-carousel-item v-for="banner in bannerList" :key="banner.id">
              <div class="banner-slide">
                <div class="banner-copy"><span class="banner-kicker">{{ banner.eyebrow }} · JD SELECT</span><h1>{{ banner.title }}</h1><p>{{ banner.description }}</p><button type="button" class="primary-action" @click="goDetail(banner.id)">查看精选 <ArrowRight /></button></div>
                <div class="banner-media"><img v-if="banner.image" :src="banner.image" :alt="banner.title" /><span v-else class="media-placeholder"><Goods /></span></div>
              </div>
            </el-carousel-item>
          </el-carousel>
          <div v-else class="empty-hero"><div><span class="banner-kicker">JD SELECT</span><h1>今天，也要好好生活</h1><p>逛逛分类，发现适合你的日常好物</p><button type="button" class="primary-action" @click="goProducts">开始逛逛 <ArrowRight /></button></div><Goods class="empty-hero-icon" /></div>
        </div>
        <aside class="welcome-panel">
          <template v-if="isLoggedIn">
            <div class="welcome-header"><span class="avatar"><UserFilled /></span><div><p class="panel-kicker">WELCOME BACK</p><h2>你好，{{ firstName }}</h2></div></div>
            <p class="welcome-copy">今天想从哪里开始？</p>
            <div class="welcome-links"><button type="button" @click="goRoute('/orders')"><span><ShoppingBag /></span><b>我的订单</b><ArrowRight /></button><button type="button" @click="goRoute('/favorites')"><span><Collection /></span><b>我的收藏</b><ArrowRight /></button><button type="button" @click="goRoute('/address')"><span><Location /></span><b>收货地址</b><ArrowRight /></button></div>
            <button type="button" class="outline-action" @click="goRoute('/profile')">进入个人中心 <ArrowRight /></button>
          </template>
          <template v-else>
            <div class="welcome-header"><span class="avatar guest-avatar"><UserFilled /></span><div><p class="panel-kicker">GOOD TO SEE YOU</p><h2>发现生活好物</h2></div></div><p class="welcome-copy">登录后同步订单、收藏和优惠券，购物更轻松。</p><button type="button" class="outline-action" @click="goRoute('/login')">登录 / 注册 <ArrowRight /></button><div class="service-note"><Van /><span>品质配送</span><Wallet /><span>安心支付</span></div>
          </template>
        </aside>
      </section>

      <section class="quick-center" :class="{ 'quick-center-guest': !isLoggedIn }" aria-label="快捷中心">
        <section class="category-section" aria-labelledby="category-title">
          <div class="section-heading"><div><p class="section-kicker">EXPLORE MORE</p><h2 id="category-title">发现好物</h2></div><button type="button" class="text-action" @click="goRoute('/category')">查看全部 <ArrowRight /></button></div>
          <el-skeleton v-if="categoryLoading" :rows="2" animated /><el-empty v-else-if="!categoryList.length" :image-size="72" description="暂时没有可浏览的分类" /><el-row v-else :gutter="12" class="category-grid"><el-col v-for="category in categoryList" :key="category.id" class="category-col" :span="4"><button class="category-item" type="button" @click="goCategory(category.id)"><span class="category-icon" :class="`tone-${resolveFeaturedCategoryVisual(category.name).tone}`"><component :is="categoryIcons[resolveFeaturedCategoryVisual(category.name).icon]" /></span><span class="category-name">{{ category.name }}</span></button></el-col></el-row>
          <div v-if="!categoryLoading && categoryList.length" class="category-footer"><span><b>精选分类</b><small>从日常好物到数码家电，一站式选购</small></span><button type="button" @click="goProducts">浏览全部商品 <ArrowRight /></button></div>
        </section>

        <section v-if="isLoggedIn" class="dashboard-section" aria-labelledby="dashboard-title">
          <div class="section-heading"><div><p class="section-kicker">YOUR SPACE</p><h2 id="dashboard-title">我的快捷入口</h2></div><span class="section-note">随时查看你的购物状态</span></div>
          <div v-loading="dashboardLoading" class="dashboard-content"><div class="summary-grid"><button type="button" class="summary-item" @click="goRoute('/cart')"><span class="summary-icon tone-orange"><ShoppingCart /></span><span><small>购物车</small><strong>{{ accountSummary.cartCount }}</strong><em>件商品</em></span><ArrowRight /></button><button type="button" class="summary-item" @click="goRoute('/favorites')"><span class="summary-icon tone-pink"><Collection /></span><span><small>我的收藏</small><strong>{{ accountSummary.favoriteCount }}</strong><em>件商品</em></span><ArrowRight /></button><button type="button" class="summary-item" @click="goRoute('/coupons')"><span class="summary-icon tone-yellow"><Ticket /></span><span><small>可用优惠券</small><strong>{{ accountSummary.couponCount }}</strong><em>张可使用</em></span><ArrowRight /></button><button type="button" class="summary-item" @click="goRoute('/address')"><span class="summary-icon tone-blue"><Location /></span><span><small>收货地址</small><strong>管理</strong><em>常用地址</em></span><ArrowRight /></button></div><div class="order-strip"><div class="order-strip-title"><b>订单状态</b><button type="button" class="text-action" @click="goRoute('/orders')">查看全部 <ArrowRight /></button></div><div class="order-grid"><button v-for="item in orderSummary" :key="item.status" type="button" class="order-item" @click="goRoute('/orders')"><span class="order-icon" :class="`order-${item.tone}`"><component :is="item.icon" /></span><span>{{ item.label }}</span><strong>{{ item.count }}</strong></button></div></div></div>
        </section>
      </section>

      <section class="promotion-section" aria-label="品牌与优惠券">
        <div class="coupon-panel"><div class="promo-heading"><div><p class="section-kicker">SAVE MORE</p><h2>优惠券中心</h2></div><button type="button" class="text-action" @click="goRoute('/coupons')">更多优惠 <ArrowRight /></button></div><div v-if="availableCouponList.length || couponList.length" class="coupon-list"><div v-for="coupon in (availableCouponList.length ? availableCouponList : couponList)" :key="coupon.id" class="coupon-item"><span class="coupon-amount"><small>￥</small>{{ coupon.amount }}</span><span class="coupon-rule">满{{ coupon.threshold }}可用<small>{{ coupon.endTime ? `有效期至 ${coupon.endTime}` : '全场可用' }}</small></span><button v-if="availableCouponList.length" type="button" class="claim-action" :disabled="claimingCouponId === coupon.id" @click="claimAvailableCoupon(coupon)">{{ claimingCouponId === coupon.id ? '领取中' : '立即领取' }}</button><span v-else class="claimed-label">已领取</span></div></div><div v-else class="promo-empty"><Ticket /><span>暂无可用优惠券，逛逛商品再回来看看</span></div></div>
        <div class="brand-panel"><div class="promo-heading"><div><p class="section-kicker">TRUSTED BRANDS</p><h2>品牌精选</h2></div><button type="button" class="text-action" @click="goProducts">逛逛商品 <ArrowRight /></button></div><div v-if="brandList.length" class="brand-list"><button v-for="brand in brandList" :key="brand.id" type="button" class="brand-item" @click="goProducts"><img v-if="brand.logo" :src="brand.logo" :alt="brand.name" /><span v-else>{{ brand.name.slice(0, 1) }}</span><b>{{ brand.name }}</b></button></div><div v-else class="promo-empty"><Goods /><span>精选品牌即将上线</span></div></div>
      </section>

      <section class="product-section" aria-labelledby="product-title">
        <div class="section-heading"><div><p class="section-kicker">CURATED FOR YOU</p><h2 id="product-title">为你推荐</h2></div><button type="button" class="text-action" @click="goProducts">查看更多 <ArrowRight /></button></div><el-empty v-if="!productList.length" description="暂时没有商品" /><el-row v-else :gutter="16" class="product-grid"><el-col v-for="product in productList" :key="product.id" :xs="12" :sm="8" :md="6" :lg="6" :xl="6"><el-card class="product-card" shadow="hover" :body-style="{ padding: '0' }" role="link" tabindex="0" @click="goDetail(product.id)" @keydown.enter="goDetail(product.id)"><div class="product-image-wrap"><img v-if="product.image" class="product-image" :src="product.image" :alt="product.title" loading="lazy" /><span v-else class="product-placeholder"><Goods /></span><span class="product-tag">{{ product.tag }}</span></div><div class="product-info"><h3>{{ product.title }}</h3><p class="product-subtitle">{{ product.subtitle }}</p><div class="product-bottom"><p class="price"><small>￥</small>{{ product.price }}</p><span class="detail-link">查看 <ArrowRight /></span></div></div></el-card></el-col></el-row>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home-page { position: relative; isolation: isolate; padding-bottom: 16px; color: #232832; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; }
.home-page::before { position: absolute; top: -28px; bottom: 0; left: 50%; z-index: -1; width: 100vw; background: #eef4f8; content: ''; transform: translateX(-50%); }
.home-skeleton { padding: 24px 0; }
.hero-section { display: grid; grid-template-columns: minmax(0, 1fr) 286px; gap: 16px; margin-bottom: 42px; }.hero-main, .welcome-panel, .coupon-panel, .brand-panel { min-width: 0; }.hero-main :deep(.el-carousel__container) { border-radius: 8px; }.hero-main :deep(.el-carousel__button) { width: 20px; height: 4px; border-radius: 2px; background: #e1251b; }
.banner-slide, .empty-hero { display: grid; height: 100%; grid-template-columns: 48% 52%; overflow: hidden; border-radius: 8px; background: #202832; }.banner-copy { display: flex; min-width: 0; flex-direction: column; justify-content: center; padding: clamp(24px, 3vw, 44px); color: #fff; }.banner-kicker, .section-kicker, .panel-kicker { font-size: 11px; font-weight: 800; letter-spacing: .12em; }.banner-kicker { color: #ffb9a8; }.banner-copy h1, .empty-hero h1 { margin: 12px 0 10px; color: #fff; font-size: clamp(27px, 3.2vw, 44px); line-height: 1.15; }.banner-copy p, .empty-hero p { max-width: 310px; margin: 0 0 24px; color: rgba(255,255,255,.75); font-size: 14px; line-height: 1.7; }.banner-media { position: relative; min-width: 0; overflow: hidden; background: #d8dde3; }.banner-media img { width: 100%; height: 100%; object-fit: cover; }.media-placeholder, .empty-hero-icon { display: grid; height: 100%; place-items: center; color: #e1251b; font-size: 80px; }.primary-action, .outline-action { display: inline-flex; width: fit-content; align-items: center; gap: 8px; border: 0; border-radius: 4px; padding: 10px 15px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }.primary-action { color: #fff; background: #e1251b; }.primary-action:hover { background: #bc1d16; }.primary-action svg, .outline-action svg, .text-action svg, .summary-item > svg, .welcome-links button > svg, .detail-link svg { width: 15px; }
.empty-hero { grid-template-columns: 70% 30%; padding: 0 clamp(24px, 5vw, 64px); }.empty-hero > div { display: flex; flex-direction: column; justify-content: center; }.empty-hero-icon { color: #f2b4a8; }.welcome-panel { display: flex; min-height: 340px; flex-direction: column; justify-content: space-between; border: 1px solid #e8ebef; border-radius: 8px; padding: 24px 20px; background: #fff; box-shadow: 0 10px 26px rgba(31, 41, 55, .05); }.welcome-header { display: flex; align-items: center; gap: 12px; }.avatar { display: grid; width: 46px; height: 46px; flex: 0 0 46px; place-items: center; border-radius: 50%; color: #e1251b; background: #fff0ee; font-size: 21px; }.guest-avatar { color: #355b82; background: #eaf2fb; }.panel-kicker { margin: 0 0 5px; color: #9ba2ac; }.welcome-panel h2 { margin: 0; color: #222831; font-size: 18px; }.welcome-copy { margin: 21px 0 8px; color: #707985; font-size: 13px; line-height: 1.6; }.welcome-links { display: grid; gap: 2px; margin: 4px 0 18px; }.welcome-links button { display: flex; align-items: center; gap: 9px; border: 0; padding: 8px 0; color: #4d5662; background: transparent; font: inherit; text-align: left; cursor: pointer; }.welcome-links button:hover, .text-action:hover { color: #e1251b; }.welcome-links button span { display: grid; width: 26px; height: 26px; place-items: center; border-radius: 4px; color: #e1251b; background: #fff3f1; }.welcome-links button b { flex: 1; font-size: 13px; font-weight: 600; }.welcome-links button > svg { width: 15px; }.outline-action { justify-content: center; border: 1px solid #e1251b; color: #d32219; background: #fff; }.outline-action:hover { color: #fff; background: #e1251b; }.service-note { display: flex; align-items: center; gap: 5px; color: #8e97a2; font-size: 11px; }.service-note svg { width: 15px; margin-left: 5px; color: #e1251b; }
.section-heading, .promo-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; }.section-heading { margin-bottom: 18px; }.section-kicker { margin: 0 0 7px; color: #e1251b; }.section-heading h2, .promo-heading h2 { margin: 0; color: #20242b; font-size: clamp(23px, 3vw, 32px); }.section-note { color: #929aa6; font-size: 13px; }.text-action { display: inline-flex; align-items: center; gap: 5px; border: 0; padding: 3px 0; color: #737c88; background: transparent; font: inherit; font-size: 13px; cursor: pointer; }.quick-center { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(360px, .85fr); align-items: stretch; gap: 28px; margin-bottom: 32px; }.quick-center-guest { grid-template-columns: 1fr; }.category-section, .dashboard-section { min-width: 0; margin-bottom: 0; }.category-section { display: flex; min-height: 100%; flex-direction: column; padding: 24px; border: 1px solid #e2ebf1; border-radius: 8px; background: rgba(255, 255, 255, .78); box-shadow: 0 8px 22px rgba(55, 91, 117, .05); }.quick-center .section-heading { margin-bottom: 14px; }.quick-center .section-heading h2 { font-size: clamp(22px, 2.5vw, 28px); }.quick-center .category-grid { flex: 1; align-content: start; row-gap: 12px; }.category-col { flex: 0 0 20%; max-width: 20%; }.quick-center .category-item { display: flex; min-height: 56px; box-sizing: border-box; justify-content: flex-start; gap: 8px; border: 1px solid transparent; border-radius: 8px; padding: 7px 6px; background: transparent; appearance: none; }.quick-center .category-item:hover, .quick-center .category-item:focus-visible { border-color: #d9e9f2; background: #fff; box-shadow: 0 5px 14px rgba(55, 91, 117, .08); outline: 0; }.quick-center .category-item > span:last-child { flex: 0 0 auto; white-space: nowrap; line-height: 1.25; }.category-icon, .summary-icon { display: grid; place-items: center; border-radius: 8px; }.category-icon { width: 40px; height: 40px; flex: 0 0 40px; color: #d97706; background: #fff3df; font-size: 20px; line-height: 1; }.category-icon svg { width: 20px; height: 20px; }.tone-orange { color: #d97706; background: #fff3df; }.tone-green { color: #2e8b57; background: #eaf7ef; }.tone-blue { color: #3c82b8; background: #eaf4fc; }.tone-purple { color: #7956b8; background: #f1ebff; }.tone-pink { color: #d25b83; background: #ffedf3; }.tone-rose { color: #c65757; background: #ffeded; }.tone-yellow { color: #a77d12; background: #fff8de; }.tone-cyan { color: #2d8d8b; background: #e6f8f6; }.tone-lime { color: #67952e; background: #eff8e3; }.tone-indigo { color: #5b6fb2; background: #edf0ff; }.quick-center .category-icon { width: 40px; height: 40px; flex-basis: 40px; font-size: 20px; }.category-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; padding-top: 14px; border-top: 1px solid #e8eff3; }.category-footer span { display: grid; gap: 3px; min-width: 0; }.category-footer b { color: #4b5965; font-size: 12px; }.category-footer small { overflow: hidden; color: #9aa6b0; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.category-footer button { display: inline-flex; flex: none; align-items: center; gap: 4px; border: 0; color: #6d7d89; background: transparent; font: inherit; font-size: 11px; cursor: pointer; }.category-footer button:hover { color: #e1251b; }.category-footer button svg { width: 13px; }
.dashboard-content { min-height: 0; }.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }.summary-item { display: flex; min-width: 0; align-items: center; gap: 8px; border: 1px solid #e8ebef; border-radius: 8px; padding: 12px; color: #6d7580; background: #fff; font: inherit; text-align: left; cursor: pointer; }.summary-item:hover { border-color: #f0b4ae; box-shadow: 0 5px 15px rgba(31, 41, 55, .06); }.summary-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 8px; font-size: 17px; }.summary-item > span:nth-child(2) { display: grid; min-width: 0; flex: 1; gap: 2px; }.summary-item small { color: #747d88; font-size: 11px; }.summary-item strong { color: #252b34; font-size: 19px; line-height: 1.1; }.summary-item em { color: #a1a8b1; font-size: 10px; font-style: normal; }.order-strip { margin-top: 10px; border: 1px solid #e8ebef; border-radius: 8px; padding: 13px 14px; background: #fff; }.order-strip-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }.order-strip-title b { color: #404852; font-size: 13px; }.order-grid { display: grid; grid-template-columns: repeat(4, 1fr); }.order-item { display: flex; min-width: 0; align-items: center; gap: 6px; border: 0; border-right: 1px solid #edf0f3; padding: 0 9px; color: #6c7581; background: transparent; font: inherit; font-size: 11px; cursor: pointer; }.order-item:first-child { padding-left: 0; }.order-item:last-child { border-right: 0; }.order-icon { display: grid; width: 26px; height: 26px; flex: 0 0 26px; place-items: center; border-radius: 50%; }.order-red { color: #db4239; background: #fff0ee; }.order-orange { color: #db7b22; background: #fff2e5; }.order-blue { color: #387bb8; background: #eaf3fc; }.order-green { color: #328c52; background: #e8f7ed; }.order-item span:nth-child(2) { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.order-item strong { color: #e1251b; font-size: 14px; }
.promotion-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 44px; }.coupon-panel, .brand-panel { min-height: 220px; border-radius: 8px; padding: 22px; }.coupon-panel { background: #fff2ef; }.brand-panel { background: #eef5fa; }.promo-heading { align-items: center; margin-bottom: 18px; }.promo-heading h2 { font-size: 22px; }.coupon-list { display: grid; gap: 9px; }.coupon-item { display: flex; min-height: 54px; align-items: center; gap: 10px; border-radius: 4px; padding: 9px 12px; background: #fff; }.coupon-amount { min-width: 66px; color: #d72a20; font-size: 26px; font-weight: 800; }.coupon-amount small { font-size: 12px; }.coupon-rule { display: grid; flex: 1; gap: 2px; color: #4c5560; font-size: 12px; }.coupon-rule small { overflow: hidden; color: #9ea6b0; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.claim-action { border: 0; border-radius: 3px; padding: 7px 9px; color: #fff; background: #e1251b; font: inherit; font-size: 11px; cursor: pointer; }.claim-action:disabled { opacity: .6; cursor: wait; }.claimed-label { color: #9ba2ac; font-size: 11px; }.promo-empty { display: flex; min-height: 115px; align-items: center; justify-content: center; gap: 8px; color: #9ba4af; font-size: 13px; }.promo-empty svg { width: 22px; color: #e1251b; }.brand-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }.brand-item { display: flex; min-width: 0; align-items: center; gap: 8px; border: 0; border-radius: 4px; padding: 10px 8px; color: #4a5967; background: #fff; font: inherit; text-align: left; cursor: pointer; }.brand-item:hover { color: #e1251b; }.brand-item img, .brand-item > span { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border-radius: 4px; object-fit: contain; color: #fff; background: #7795ad; font-size: 15px; font-weight: 800; }.brand-item b { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.product-section { padding-bottom: 24px; }.product-card { overflow: hidden; border: 1px solid #edf0f3; border-radius: 8px; background: #fff; cursor: pointer; }.product-card:hover { border-color: #f0b4ae; }.product-image-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: #f1f3f5; }.product-image { width: 100%; height: 100%; object-fit: cover; transition: transform .25s ease; }.product-card:hover .product-image { transform: scale(1.04); }.product-placeholder { display: grid; width: 100%; height: 100%; place-items: center; color: #bac3cc; font-size: 48px; }.product-tag { position: absolute; top: 10px; left: 10px; border-radius: 3px; padding: 4px 7px; color: #a71b15; background: #fff0ee; font-size: 10px; font-weight: 800; }.product-info { padding: 14px; }.product-info h3 { display: -webkit-box; min-height: 42px; margin: 0 0 5px; overflow: hidden; color: #333a45; font-size: 14px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.product-subtitle { display: -webkit-box; height: 18px; margin: 0 0 10px; overflow: hidden; color: #9aa2ac; font-size: 11px; line-height: 18px; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }.product-bottom { display: flex; align-items: center; justify-content: space-between; }.price { margin: 0; color: #e1251b; font-size: 21px; font-weight: 800; }.price small { font-size: 12px; }.detail-link { display: inline-flex; align-items: center; gap: 2px; color: #9aa2ac; font-size: 11px; }.detail-link svg { width: 12px; }
@media (max-width: 960px) { .quick-center { grid-template-columns: 1fr; gap: 30px; } }
@media (max-width: 900px) { .hero-section { grid-template-columns: 1fr; }.welcome-panel { min-height: auto; gap: 13px; }.welcome-links { grid-template-columns: repeat(3, 1fr); }.welcome-links button { flex-direction: column; align-items: flex-start; }.welcome-links button > svg { display: none; }.summary-grid { grid-template-columns: repeat(2, 1fr); }.order-item { padding: 0 8px; } }
@media (max-width: 640px) { .quick-center { gap: 28px; margin-bottom: 30px; }.quick-center .dashboard-section { margin-bottom: 0; }.hero-section { gap: 12px; margin-bottom: 34px; }.banner-slide { grid-template-columns: 1fr; grid-template-rows: 55% 45%; }.banner-copy { padding: 22px; }.banner-copy h1, .empty-hero h1 { margin: 8px 0; font-size: 29px; }.banner-copy p { margin-bottom: 13px; font-size: 12px; }.banner-media { grid-row: 1; }.banner-copy { grid-row: 2; }.empty-hero { grid-template-columns: 1fr; padding: 24px; }.empty-hero-icon { display: none; }.welcome-panel { padding: 19px; }.welcome-links { gap: 5px; }.welcome-links button { font-size: 11px; }.section-note { display: none; }.section-heading h2 { font-size: 23px; }.category-col { flex: 0 0 50%; max-width: 50%; }.category-icon { width: 38px; height: 38px; flex-basis: 38px; font-size: 20px; }.category-item { justify-content: flex-start; gap: 7px; font-size: 12px; }.dashboard-section { margin-bottom: 34px; }.summary-item { padding: 11px; }.summary-item strong { font-size: 18px; }.order-strip { padding: 13px 10px; }.order-grid { grid-template-columns: repeat(2, 1fr); row-gap: 12px; }.order-item, .order-item:first-child { border-right: 0; padding: 0; }.promotion-section { grid-template-columns: 1fr; gap: 12px; margin-bottom: 34px; }.coupon-panel, .brand-panel { min-height: 190px; padding: 18px; }.brand-list { grid-template-columns: repeat(2, 1fr); }.coupon-item { gap: 6px; padding: 8px; }.coupon-amount { min-width: 55px; font-size: 22px; }.coupon-rule { font-size: 11px; }.product-info { padding: 11px; }.product-info h3 { min-height: 38px; font-size: 12px; }.product-subtitle { font-size: 10px; }.price { font-size: 18px; } }
.quick-center .category-item { align-items: center; }
.category-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
