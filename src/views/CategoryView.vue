<script setup>
import { computed, onMounted, ref } from 'vue'
import { CollectionTag, Goods, Grid, Monitor, MoreFilled, ShoppingBag } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getCategoryTree, getProductList } from '../api/index.js'
import { getChildCategories, normalizeCategoryProducts, normalizeCategoryTree } from '../utils/category.js'

const router = useRouter()
const categories = ref([])
const products = ref([])
const selectedCategoryId = ref(null)
const loadingCategories = ref(true)
const loadingProducts = ref(false)

const categoryIcons = [Monitor, Goods, ShoppingBag, CollectionTag, Grid, MoreFilled]
const selectedCategory = computed(() => categories.value.find((category) => category.id === selectedCategoryId.value) || null)
const childCategories = computed(() => getChildCategories(selectedCategory.value))
const formatPrice = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const loadProducts = async (category) => {
  loadingProducts.value = true
  try {
    const children = getChildCategories(category)
    if (!children.length) {
      products.value = []
      return
    }
    const results = await Promise.all(children.map((child) => getProductList({ categoryId: child.id, page: 1, size: 8 })))
    const uniqueProducts = new Map()
    results.flatMap(normalizeCategoryProducts).forEach((product) => uniqueProducts.set(product.id, product))
    products.value = Array.from(uniqueProducts.values()).slice(0, 8)
  } catch (error) {
    products.value = []
    ElMessage.error(error.message || '推荐商品加载失败，请稍后重试')
  } finally {
    loadingProducts.value = false
  }
}

const selectCategory = async (id) => {
  const category = categories.value.find((item) => item.id === Number(id))
  if (!category || category.id === selectedCategoryId.value) return
  selectedCategoryId.value = category.id
  await loadProducts(category)
}

const loadCategories = async () => {
  loadingCategories.value = true
  try {
    categories.value = normalizeCategoryTree(await getCategoryTree())
    const firstCategory = categories.value[0]
    if (firstCategory) {
      selectedCategoryId.value = firstCategory.id
      await loadProducts(firstCategory)
    }
  } catch (error) {
    categories.value = []
    ElMessage.error(error.message || '分类加载失败，请稍后重试')
  } finally {
    loadingCategories.value = false
  }
}

const goToCategory = (category) => router.push({ name: 'home', query: { categoryId: category.id } })
const goToProduct = (product) => router.push({ name: 'product-detail', params: { id: product.id } })

onMounted(loadCategories)
</script>

<template>
  <main class="category-page">
    <el-skeleton v-if="loadingCategories" :rows="10" animated class="page-skeleton" />
    <el-empty v-else-if="!categories.length" description="暂时没有可浏览的分类" />
    <section v-else class="category-shell">
      <aside class="category-nav" aria-label="一级分类">
        <el-menu :default-active="String(selectedCategoryId)" @select="selectCategory">
          <el-menu-item v-for="category in categories" :key="category.id" :index="String(category.id)">
            <span>{{ category.name }}</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <section class="category-content">
        <div class="mobile-nav" aria-label="一级分类">
          <button v-for="category in categories" :key="category.id" class="mobile-nav-item" :class="{ active: category.id === selectedCategoryId }" type="button" @click="selectCategory(category.id)">
            {{ category.name }}
          </button>
        </div>

        <div class="content-heading">
          <div>
            <p class="eyebrow">CATEGORY GUIDE</p>
            <h1>{{ selectedCategory?.name }}</h1>
          </div>
          <span>{{ childCategories.length }} 个细分品类</span>
        </div>

        <section class="children-section" aria-labelledby="children-title">
          <h2 id="children-title">细分品类</h2>
          <el-empty v-if="!childCategories.length" :image-size="72" description="该分类暂无细分品类" />
          <el-row v-else :gutter="12" class="children-grid">
            <el-col v-for="(category, index) in childCategories" :key="category.id" :xs="8" :sm="6" :md="4" :lg="4">
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
.category-page{min-height:calc(100vh - 140px);font-family:'PingFang SC','Microsoft YaHei',sans-serif}.page-skeleton{padding:24px}.category-shell{display:grid;grid-template-columns:88px minmax(0,1fr);min-height:620px;border:1px solid #edf0f3;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 10px 34px rgba(31,41,55,.05)}.category-nav{padding:12px 8px;background:#f7f8fa}.category-nav :deep(.el-menu){border:0;background:transparent}.category-nav :deep(.el-menu-item){height:auto;min-height:52px;justify-content:center;padding:9px 4px!important;border-radius:10px;color:#66717f;white-space:normal;line-height:1.35;text-align:center}.category-nav :deep(.el-menu-item:hover){background:#fff0ee}.category-nav :deep(.el-menu-item.is-active){color:#d92218;background:#fff;font-weight:700;box-shadow:0 4px 12px rgba(225,37,27,.09)}.category-content{min-width:0;padding:30px clamp(18px,4vw,48px) 42px}.mobile-nav{display:none}.content-heading,.section-heading{display:flex;align-items:end;justify-content:space-between;gap:16px}.eyebrow{margin:0 0 7px;color:#e1251b;font-size:11px;font-weight:800;letter-spacing:.16em}.content-heading h1{margin:0;color:#20242b;font-size:clamp(27px,4vw,40px);letter-spacing:-.06em}.content-heading>span,.section-heading span{color:#969eaa;font-size:12px}.children-section{margin-top:30px}.children-section h2,.section-heading h2{margin:0;color:#303842;font-size:18px}.children-grid{margin-top:16px;row-gap:12px}.child-card{display:flex;width:100%;min-height:112px;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:12px 6px;border:1px solid #eef0f2;border-radius:14px;color:#596574;background:#fff;font:inherit;font-size:13px;cursor:pointer;transition:transform .18s,box-shadow .18s,color .18s}.child-card:hover{color:#d92218;transform:translateY(-2px);box-shadow:0 9px 20px rgba(31,41,55,.09)}.child-icon{display:grid;width:46px;height:46px;place-items:center;border-radius:15px;color:#e1251b;background:#fff0ee;font-size:23px}.recommendation-section{min-height:240px;margin-top:38px;padding-top:26px;border-top:1px solid #eef0f2}.product-grid{margin-top:18px;row-gap:14px}.product-card{overflow:hidden;border:1px solid #edf0f3;border-radius:14px;background:#fff;cursor:pointer;transition:transform .18s,box-shadow .18s}.product-card:hover,.product-card:focus-visible{transform:translateY(-3px);box-shadow:0 12px 24px rgba(31,41,55,.12);outline:0}.product-image-wrap{display:grid;aspect-ratio:1;place-items:center;overflow:hidden;background:#f3f5f7}.product-image-wrap img{width:100%;height:100%;object-fit:cover}.image-fallback{color:#a7b0bc;font-size:34px}.product-info{padding:12px}.product-info h3{display:-webkit-box;min-height:39px;margin:0 0 9px;overflow:hidden;color:#343c47;font-size:13px;font-weight:600;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:2}.product-info strong{color:#e1251b;font-size:20px}.product-info small{margin-right:2px;font-size:12px}@media(max-width:700px){.category-shell{display:block;border:0;border-radius:0;box-shadow:none}.category-nav{display:none}.category-content{padding:0 0 24px}.mobile-nav{display:flex;gap:8px;margin:0 -16px;padding:0 16px 14px;overflow-x:auto;border-bottom:1px solid #eef0f2;background:#fff;scrollbar-width:none}.mobile-nav::-webkit-scrollbar{display:none}.mobile-nav-item{flex:0 0 auto;padding:8px 11px;border:0;border-radius:999px;color:#687382;background:#f2f4f6;font:inherit;font-size:13px;white-space:nowrap}.mobile-nav-item.active{color:#fff;background:#e1251b;font-weight:700}.content-heading{padding:24px 0 0}.children-section{margin-top:24px}.child-card{min-height:96px;font-size:12px}.child-icon{width:40px;height:40px;border-radius:13px;font-size:20px}.recommendation-section{margin-top:28px;padding-top:22px}.section-heading span{display:none}}@media(max-width:400px){.child-card{min-height:84px;gap:6px}.child-icon{width:35px;height:35px;font-size:17px}.product-info{padding:10px}.product-info strong{font-size:17px}}
</style>
