<script setup>
import { computed, onMounted, ref } from 'vue'
import { CollectionTag, Goods, Grid, Monitor, MoreFilled, ShoppingBag } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '../api/index.js'
import {
  buildCategoryProductsRoute,
  flattenCategoryTree,
  getProductCategoryTargets,
  normalizeCategoryProducts,
  normalizeCategoryTree,
} from '../utils/category.js'

const router = useRouter()
const categories = ref([])
const products = ref([])
const selectedCategoryId = ref(null)
const loadingCategories = ref(true)
const loadingProducts = ref(false)
let categoryRequestSequence = 0
let productRequestSequence = 0

const categoryIcons = [Monitor, Goods, ShoppingBag, CollectionTag, Grid, MoreFilled]
const navigationCategories = computed(() => flattenCategoryTree(categories.value))
const selectedCategory = computed(() => navigationCategories.value.find((category) => category.id === selectedCategoryId.value) || null)
const visibleCategories = computed(() => {
  const current = selectedCategory.value
  return current?.children?.length ? current.children : current ? [current] : []
})
const formatPrice = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const loadProducts = async (category) => {
  const sequence = ++productRequestSequence
  loadingProducts.value = true
  products.value = []
  try {
    const targets = getProductCategoryTargets(category)
    if (!targets.length) {
      if (sequence !== productRequestSequence || selectedCategoryId.value !== category.id) return
      products.value = []
      return
    }
    const results = await Promise.allSettled(targets.map((target) => getProductList({ categoryId: target.id, page: 1, size: 8 })))
    const successfulResults = results.filter((result) => result.status === 'fulfilled')
    if (!successfulResults.length) throw results[0].reason
    const uniqueProducts = new Map()
    successfulResults
      .flatMap((result) => normalizeCategoryProducts(result.value))
      .forEach((product) => uniqueProducts.set(product.id, product))
    if (sequence !== productRequestSequence || selectedCategoryId.value !== category.id) return
    products.value = Array.from(uniqueProducts.values()).slice(0, 8)
  } catch (error) {
    if (sequence !== productRequestSequence || selectedCategoryId.value !== category.id) return
    products.value = []
    ElMessage.error(error.message || '推荐商品加载失败，请稍后重试')
  } finally {
    if (sequence === productRequestSequence && selectedCategoryId.value === category.id) loadingProducts.value = false
  }
}

const selectCategory = async (id) => {
  const category = navigationCategories.value.find((item) => item.id === Number(id))
  if (!category || category.id === selectedCategoryId.value) return
  selectedCategoryId.value = category.id
  await loadProducts(category)
}

const loadCategories = async () => {
  const sequence = ++categoryRequestSequence
  loadingCategories.value = true
  categories.value = []
  products.value = []
  selectedCategoryId.value = null
  try {
    const nextCategories = normalizeCategoryTree(await getCategoryTree())
    if (sequence !== categoryRequestSequence) return
    categories.value = nextCategories
    const firstCategory = nextCategories[0]
    if (firstCategory) {
      selectedCategoryId.value = firstCategory.id
      await loadProducts(firstCategory)
    }
  } catch (error) {
    if (sequence !== categoryRequestSequence) return
    categories.value = []
    ElMessage.error(error.message || '分类加载失败，请稍后重试')
  } finally {
    if (sequence === categoryRequestSequence) loadingCategories.value = false
  }
}

const goToCategory = (category) => router.push(buildCategoryProductsRoute(category.id))
const goToProduct = (product) => router.push({ name: 'product-detail', params: { id: product.id } })

onMounted(loadCategories)
</script>

<template>
  <main class="category-page">
    <el-skeleton v-if="loadingCategories" :rows="10" animated class="page-skeleton" />
    <el-empty v-else-if="!categories.length" description="暂时没有可浏览的分类" />
    <section v-else class="category-shell">
      <aside class="category-nav" aria-label="商品分类">
        <el-menu :default-active="String(selectedCategoryId)" @select="selectCategory">
          <el-menu-item v-for="category in navigationCategories" :key="category.id" :index="String(category.id)" :class="{ 'is-child-category': category.depth > 0 }">
            <span v-if="category.depth > 0" class="nav-marker" aria-hidden="true">—</span>
            <span>{{ category.name }}</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <section class="category-content">
        <div class="mobile-nav" aria-label="一级分类">
          <button v-for="category in navigationCategories" :key="category.id" class="mobile-nav-item" :class="{ active: category.id === selectedCategoryId, child: category.depth > 0 }" type="button" @click="selectCategory(category.id)">
            {{ category.depth > 0 ? `· ${category.name}` : category.name }}
          </button>
        </div>

        <div class="content-heading">
          <div>
            <p class="eyebrow">CATEGORY GUIDE</p>
            <h1>{{ selectedCategory?.name }}</h1>
          </div>
          <span>{{ navigationCategories.length }} 个可浏览品类</span>
        </div>

        <section class="children-section" aria-labelledby="children-title">
          <h2 id="children-title">细分品类</h2>
          <el-empty v-if="!visibleCategories.length" :image-size="72" description="该分类暂无可浏览品类" />
          <el-row v-else :gutter="12" class="children-grid">
            <el-col v-for="(category, index) in visibleCategories" :key="category.id" :xs="8" :sm="6" :md="4" :lg="4">
              <button class="child-card" type="button" @click="goToCategory(category)">
                <span class="child-icon"><component :is="categoryIcons[index % categoryIcons.length]" /></span>
                <span>{{ category.name }}</span>
              </button>
            </el-col>
          </el-row>
        </section>

        <section class="recommendation-section" aria-labelledby="recommendation-title" v-loading="loadingProducts">
          <div class="section-heading"><h2 id="recommendation-title">推荐商品</h2><span>精选好物，随心选购</span></div>
          <el-skeleton v-if="loadingProducts" :rows="5" animated />
          <el-empty v-else-if="!products.length" description="该分类下暂时没有推荐商品" />
          <el-row v-else :gutter="14" class="product-grid">
            <el-col v-for="product in products" :key="product.id" :xs="12" :sm="8" :md="6" :lg="6">
              <article class="product-card" tabindex="0" role="link" @click="goToProduct(product)" @keydown.enter="goToProduct(product)">
                <div class="product-image-wrap">
                  <img v-if="product.image" :src="product.image" :alt="product.title" loading="lazy" />
                  <span v-else class="image-fallback"><Goods /></span>
                </div>
                <div class="product-info"><h3>{{ product.title }}</h3><strong><small>¥</small>{{ formatPrice(product.price) }}</strong></div>
              </article>
            </el-col>
          </el-row>
        </section>
      </section>
    </section>
  </main>
</template>

<style scoped>
.category-page {
  min-height: calc(100vh - 136px);
  padding: 0;
  box-sizing: border-box;
  background: #f5f5f5;
  color: #303133;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.page-skeleton { padding: 24px; background: #fff; border-radius: 12px; }

.category-shell {
  display: flex;
  width: 100%;
  min-height: 620px;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
}

.category-nav {
  flex: 0 0 168px;
  width: 168px;
  padding: 0;
  background: #fafafa;
  border-right: 1px solid #ebeef5;
}

.category-nav :deep(.el-menu) { height: 100%; margin: 0; padding: 0; border-right: 0; background: transparent; }

.category-nav :deep(.el-menu-item) {
  display: flex;
  min-height: 58px;
  height: auto;
  padding: 10px 14px !important;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  font-size: 13px;
  line-height: 1.45;
  text-align: left;
  white-space: normal;
  transition: color .2s ease, background-color .2s ease;
}

.category-nav :deep(.el-menu-item:hover) { color: #e1251b; background: #fff1f0; }
.category-nav :deep(.el-menu-item.is-active) { color: #e1251b; background: #fff; font-weight: 700; }
.category-nav :deep(.el-menu-item.is-child-category) { min-height: 46px; padding-left: 24px !important; color: #7a8290; font-size: 12px; }
.category-nav :deep(.el-menu-item.is-child-category.is-active) { color: #e1251b; }
.nav-marker { margin-right: 7px; color: #c0c4cc; }

.category-content {
  flex: 1;
  min-width: 0;
  padding: 16px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.mobile-nav { display: none; }

.content-heading,
.children-section,
.recommendation-section {
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
}

.content-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
.eyebrow { margin: 0 0 6px; color: #e1251b; font-size: 11px; font-weight: 700; letter-spacing: .14em; }
.content-heading h1 { margin: 0; color: #303133; font-size: 28px; line-height: 1.2; }
.content-heading > span,
.section-heading > span { color: #909399; font-size: 13px; }

.children-section { margin-bottom: 16px; }
.children-section h2,
.section-heading h2 { margin: 0; color: #303133; font-size: 18px; }
.children-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 260px)); justify-content: space-between; gap: 14px; margin-top: 18px; }
.children-grid :deep(.el-col) { width: auto; max-width: none; }

.child-card {
  display: flex;
  width: 100%;
  min-height: 112px;
  padding: 14px 8px;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  color: #606266;
  background: #fff;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, color .2s ease;
}

.child-card:hover,
.child-card:focus-visible { color: #e1251b; transform: translateY(-2px); outline: 0; box-shadow: 0 5px 14px rgba(225, 37, 27, .14); }
.child-icon { display: grid; width: 46px; height: 46px; place-items: center; border-radius: 50%; color: #e1251b; background: #fff1f0; font-size: 22px; }

.recommendation-section { min-height: 260px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.product-grid :deep(.el-col) { width: auto; max-width: none; }

.product-card {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
}

.product-card:hover,
.product-card:focus-visible { transform: translateY(-3px); outline: 0; box-shadow: 0 7px 18px rgba(0, 0, 0, .12); }
.product-image-wrap { display: grid; aspect-ratio: 1; place-items: center; overflow: hidden; background: #f5f7fa; }
.product-image-wrap img { width: 100%; height: 100%; object-fit: cover; }
.image-fallback { color: #c0c4cc; font-size: 34px; }
.product-info { padding: 12px; }
.product-info h3 { display: -webkit-box; min-height: 40px; margin: 0 0 8px; overflow: hidden; color: #303133; font-size: 13px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.product-info strong { color: #e1251b; font-size: 20px; }
.product-info small { margin-right: 2px; font-size: 12px; }

@media (max-width: 900px) {
  .children-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .category-page { padding: 0 0 16px; }
  .category-shell { display: block; min-height: 0; border-radius: 0; box-shadow: none; }
  .category-nav { display: none; }
  .category-content { padding: 12px; }
  .mobile-nav { display: flex; gap: 8px; margin: -12px -12px 12px; padding: 12px; overflow-x: auto; background: #fff; border-bottom: 1px solid #ebeef5; }
  .mobile-nav-item { flex: 0 0 auto; padding: 8px 12px; border: 0; border-radius: 16px; color: #606266; background: #f5f5f5; font: inherit; font-size: 13px; white-space: nowrap; }
  .mobile-nav-item.child { color: #7a8290; background: #fafafa; font-size: 12px; }
  .mobile-nav-item.active { color: #fff; background: #e1251b; }
  .content-heading,
  .children-section,
  .recommendation-section { padding: 16px; }
  .content-heading h1 { font-size: 24px; }
  .content-heading > span,
  .section-heading > span { display: none; }
  .children-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .child-card { min-height: 96px; font-size: 12px; }
  .child-icon { width: 40px; height: 40px; font-size: 19px; }
}
</style>
