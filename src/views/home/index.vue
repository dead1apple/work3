<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Basketball, Brush, Goods, House, Monitor, Present, Reading, Refrigerator, ShoppingBag, ShoppingCart,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '../../api/index.js'
import { buildCategoryProductsRoute, normalizeCategoryTree, selectFeaturedCategories } from '../../utils/category.js'

const router = useRouter()
const loading = ref(true)
const categoryLoading = ref(true)
const productList = ref([])
const categoryList = ref([])

const categoryVisuals = [
  { icon: ShoppingCart, tone: 'orange' },
  { icon: Goods, tone: 'green' },
  { icon: Monitor, tone: 'blue' },
  { icon: Refrigerator, tone: 'purple' },
  { icon: ShoppingBag, tone: 'pink' },
  { icon: Brush, tone: 'rose' },
  { icon: Present, tone: 'yellow' },
  { icon: House, tone: 'cyan' },
  { icon: Basketball, tone: 'lime' },
  { icon: Reading, tone: 'indigo' },
]

const bannerList = computed(() => productList.value.slice(0, 4).map((product) => ({
  id: product.id,
  title: product.title,
  subtitle: product.subtitle || '精选好物，品质生活',
  image: product.image,
})))

const formatPrice = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const normalizeProduct = (item) => {
  const product = item?.product || item || {}
  return {
    id: product.id,
    title: product.name || product.title || '未命名商品',
    subtitle: product.subtitle || '',
    price: formatPrice(item?.minPrice ?? product.minPrice ?? product.price),
    tag: product.status === 1 ? '在售' : '精选',
    image: product.mainImage || product.images?.[0] || '',
  }
}

const loadProducts = async () => {
  loading.value = true
  try {
    const result = await getProductList({ page: 1, size: 12 })
    const list = Array.isArray(result) ? result : result?.list
    productList.value = (list || []).map(normalizeProduct).filter((product) => product.id)
  } catch (error) {
    ElMessage.error(error.message || '商品加载失败，请稍后重试')
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
    ElMessage.warning(error.message || '分类加载失败，请稍后重试')
  } finally {
    categoryLoading.value = false
  }
}

const goDetail = (productId) => router.push(`/product/${productId}`)
const goCategory = (categoryId) => router.push(buildCategoryProductsRoute(categoryId))

onMounted(() => Promise.allSettled([loadProducts(), loadCategories()]))
</script>

<template>
  <div class="home-page">
    <el-skeleton v-if="loading" :rows="8" animated class="home-skeleton" />
    <template v-else>
      <section v-if="bannerList.length" class="hero-section" aria-label="商品推荐">
        <el-carousel height="clamp(220px, 36vw, 410px)" :interval="4500" arrow="always" indicator-position="outside">
          <el-carousel-item v-for="banner in bannerList" :key="banner.id">
            <div class="banner-slide">
              <img :src="banner.image" :alt="banner.title" />
              <div class="banner-overlay"></div>
              <div class="banner-copy">
                <span class="banner-kicker">JD SELECT · REAL GOODS</span>
                <h1>{{ banner.title }}</h1>
                <p>{{ banner.subtitle }}</p>
                <button type="button" @click="goDetail(banner.id)">查看详情 <span aria-hidden="true">→</span></button>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </section>

      <section class="category-section" aria-labelledby="category-title">
        <div class="section-heading"><div><p class="section-kicker">EXPLORE MORE</p><h2 id="category-title">发现好物</h2></div><span class="section-note">一站式满足生活所需</span></div>
        <el-skeleton v-if="categoryLoading" :rows="2" animated />
        <el-empty v-else-if="!categoryList.length" :image-size="72" description="暂时没有可浏览的分类" />
        <el-row v-else :gutter="12" class="category-grid">
          <el-col v-for="(category, index) in categoryList" :key="category.id" class="category-col" :span="4">
            <button class="category-item" type="button" @click="goCategory(category.id)"><span class="category-icon" :class="`tone-${categoryVisuals[index % categoryVisuals.length].tone}`"><component :is="categoryVisuals[index % categoryVisuals.length].icon" /></span><span>{{ category.name }}</span></button>
          </el-col>
        </el-row>
      </section>

      <section class="product-section" aria-labelledby="product-title">
        <div class="section-heading"><div><p class="section-kicker">CURATED FOR YOU</p><h2 id="product-title">为你推荐</h2></div><span class="section-note">共 {{ productList.length }} 件商品</span></div>
        <el-empty v-if="!productList.length" description="暂时没有商品" />
        <el-row v-else :gutter="16" class="product-grid">
          <el-col v-for="product in productList" :key="product.id" :xs="12" :sm="8" :md="6" :lg="6" :xl="6">
            <el-card class="product-card" shadow="hover" :body-style="{ padding: '0' }" role="link" tabindex="0" @click="goDetail(product.id)" @keydown.enter="goDetail(product.id)">
              <div class="product-image-wrap"><img class="product-image" :src="product.image" :alt="product.title" loading="lazy" /><span class="product-tag">{{ product.tag }}</span></div>
              <div class="product-info"><h3>{{ product.title }}</h3><div class="product-bottom"><p class="price"><small>￥</small>{{ product.price }}</p></div></div>
            </el-card>
          </el-col>
        </el-row>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home-page { padding-bottom: 8px; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; letter-spacing: 1px; }
.home-skeleton { padding: 24px 0; }
.hero-section { margin-bottom: 38px; }.banner-slide { position: relative; height: 100%; overflow: hidden; border-radius: 20px; background: #253042; }.banner-slide img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.86); }.banner-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(13,20,32,.76), rgba(13,20,32,.08) 70%), linear-gradient(0deg, rgba(13,20,32,.28), transparent 45%); }.banner-copy { position: absolute; top: 50%; left: clamp(24px,6vw,74px); max-width: 440px; color: #fff; transform: translateY(-50%); }.banner-kicker,.section-kicker { font-size: 11px; font-weight: 800; letter-spacing: .18em; }.banner-kicker { color: #ffc3bd; }.banner-copy h1 { margin: 10px 0 8px; font-size: clamp(30px,5vw,62px); letter-spacing: .03em; line-height: .98; }.banner-copy p { margin: 0 0 24px; color: rgba(255,255,255,.82); font-size: clamp(13px,1.8vw,17px); }.banner-copy button { padding: 11px 17px; border: 1px solid rgba(255,255,255,.45); border-radius: 999px; color: #fff; background: rgba(255,255,255,.14); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.section-heading { display: flex; align-items: end; justify-content: space-between; margin-bottom: 18px; }.section-kicker { margin: 0 0 7px; color: #e1251b; }h2 { margin: 0; color: #20242b; font-size: clamp(24px,3vw,34px); letter-spacing: normal; }.section-note { color: #929aa6; font-size: 13px; }.category-section { margin-bottom: 44px; }.category-grid,.product-grid { row-gap: 16px; }.category-col { flex: 0 0 20%; max-width: 20%; }.category-item { display: flex; width: 100%; flex-direction: row; align-items: center; justify-content: center; gap: 9px; border: 0; color: #5f6875; background: transparent; font: inherit; font-size: 13px; cursor: pointer; }.category-item:hover { color: #e1251b; }.category-item:focus-visible { color: #e1251b; outline: 2px solid #e1251b; outline-offset: 4px; border-radius: 10px; }.category-icon { display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center; border-radius: 13px; font-size: 22px; }.tone-orange{background:#fff0dd}.tone-green{background:#e6f7eb}.tone-blue{background:#e6f2ff}.tone-purple{background:#f0eaff}.tone-pink{background:#ffe9f0}.tone-rose{background:#ffebeb}.tone-yellow{background:#fff7d9}.tone-cyan{background:#e3f8f6}.tone-lime{background:#edf8df}.tone-indigo{background:#e9edff}.product-section { padding-bottom: 24px; }.product-card { overflow: hidden; border: 1px solid #edf0f3; border-radius: 16px; background: #fff; cursor: pointer; }.product-image-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: #f1f3f5; }.product-image { width: 100%; height: 100%; object-fit: cover; }.product-tag { position: absolute; top: 10px; left: 10px; padding: 4px 7px; border-radius: 6px; color: #a71b15; background: #fff0ee; font-size: 10px; font-weight: 800; }.product-info { padding: 14px; }.product-info h3 { display: -webkit-box; min-height: 42px; margin: 0 0 12px; overflow: hidden; color: #333a45; font-size: 14px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.product-bottom { display: flex; align-items: center; justify-content: flex-start; }.price { margin: 0; color: #e1251b; font-size: 22px; font-weight: 800; }.price small { font-size: 12px; }:deep(.el-carousel__container){border-radius:20px}:deep(.el-carousel__button){width:18px;height:4px;border-radius:99px;background:#e1251b}
@media (max-width:640px){.banner-slide{border-radius:16px}.banner-copy{left:22px}.banner-copy h1{font-size:34px}.section-note{display:none}.category-col{flex:0 0 50%;max-width:50%}.category-icon{width:38px;height:38px;flex-basis:38px;font-size:20px}.category-item{justify-content:flex-start;gap:7px;font-size:12px}.product-info{padding:11px}.product-info h3{min-height:38px;font-size:12px}.price{font-size:18px}}
</style>
