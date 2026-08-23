<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFavorites, getProductDetail, removeFavorite } from '../api/index.js'
import { normalizeFavoriteList } from '../utils/favorite.js'

const router = useRouter()
const favorites = ref([])
const total = ref(0)
const loading = ref(true)
const loadError = ref(false)
const removingId = ref(null)

const countText = computed(() => `共 ${total.value || favorites.value.length} 件商品`)
const formatPrice = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const loadFavorites = async () => {
  loading.value = true
  loadError.value = false
  try {
    const payload = await getFavorites()
    const baseResult = normalizeFavoriteList(payload)
    const detailEntries = await Promise.all(baseResult.list.map(async (item) => {
      try {
        return [Number(item.productId), await getProductDetail(item.productId)]
      } catch {
        return [Number(item.productId), null]
      }
    }))
    const result = normalizeFavoriteList(payload, new Map(detailEntries.filter(([, detail]) => detail)))
    favorites.value = result.list
    total.value = result.total
  } catch (error) {
    loadError.value = true
    favorites.value = []
    ElMessage.error(error?.message || '收藏夹加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const openProduct = (productId) => router.push(`/product/${productId}`)

const handleRemove = async (item) => {
  try {
    await ElMessageBox.confirm('确定不再收藏这件商品吗？', '取消收藏', {
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
      type: 'warning',
      center: true,
    })
    removingId.value = item.productId
    await removeFavorite(item.productId)
    favorites.value = favorites.value.filter((entry) => entry.productId !== item.productId)
    total.value = Math.max(0, total.value - 1)
    ElMessage.success('已取消收藏')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '取消收藏失败，请稍后重试')
  } finally {
    removingId.value = null
  }
}

onMounted(loadFavorites)
</script>

<template>
  <main class="favorites-page">
    <section class="favorites-panel" aria-labelledby="favorites-title">
      <header class="panel-header">
        <div>
          <h1 id="favorites-title">我的收藏</h1>
          <p>把喜欢的商品留在这里，方便下次找到</p>
        </div>
        <span v-if="!loading && !loadError" class="favorite-count">{{ countText }}</span>
      </header>

      <div v-if="loading" class="skeleton-grid" aria-label="正在加载收藏商品">
        <div v-for="index in 8" :key="index" class="skeleton-card">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" class="skeleton-image" />
              <el-skeleton-item variant="text" class="skeleton-title" />
              <el-skeleton-item variant="text" class="skeleton-price" />
            </template>
          </el-skeleton>
        </div>
      </div>

      <div v-else-if="loadError" class="state-area">
        <div class="state-icon error-icon" aria-hidden="true">!</div>
        <h2>收藏夹加载失败</h2>
        <p>网络开小差了，请检查后重新加载</p>
        <el-button type="danger" @click="loadFavorites">重新加载</el-button>
      </div>

      <div v-else-if="!favorites.length" class="state-area">
        <div class="state-icon" aria-hidden="true">♡</div>
        <h2>收藏夹还是空的</h2>
        <p>看到喜欢的商品，点击收藏就能在这里找到</p>
        <el-button type="danger" @click="router.push('/products')">去逛逛</el-button>
      </div>

      <div v-else class="product-grid">
        <article v-for="item in favorites" :key="item.productId" class="product-card">
          <button class="product-cover" type="button" :aria-label="`查看${item.title}`" @click="openProduct(item.productId)">
            <img v-if="item.image" :src="item.image" :alt="item.title" />
            <span v-else class="image-placeholder" aria-hidden="true">商品图片</span>
          </button>
          <div class="product-info">
            <button class="product-title" type="button" @click="openProduct(item.productId)">{{ item.title }}</button>
            <div class="price-row">
              <strong><small>¥</small>{{ formatPrice(item.price) }}</strong>
              <span v-if="item.sales">已售 {{ item.sales }}</span>
            </div>
            <div class="card-actions">
              <el-button plain @click="openProduct(item.productId)">查看商品</el-button>
              <el-button text type="danger" :loading="removingId === item.productId" @click="handleRemove(item)">取消收藏</el-button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.favorites-page{min-height:calc(100vh - 136px);padding:24px 16px 44px;color:#333;background:#f5f5f5;font-family:'PingFang SC','Microsoft YaHei',Arial,sans-serif}.favorites-panel{width:min(1180px,100%);min-height:540px;margin:0 auto;padding:0 28px 34px;border:1px solid #eee;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04)}.panel-header{display:flex;align-items:center;justify-content:space-between;min-height:88px;margin-bottom:24px;border-bottom:2px solid #f1f1f1}.panel-header>div{position:relative;align-self:stretch;display:flex;flex-direction:column;justify-content:center}.panel-header>div::after{position:absolute;bottom:-2px;left:0;width:86px;height:2px;background:#e1251b;content:''}.panel-header h1{margin:0;color:#222;font-size:22px;font-weight:600}.panel-header p{margin:8px 0 0;color:#999;font-size:13px}.favorite-count{color:#888;font-size:13px}.product-grid,.skeleton-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px 16px}.product-card,.skeleton-card{overflow:hidden;border:1px solid #eee;background:#fff}.product-card{transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}.product-card:hover{border-color:#f2b5b1;box-shadow:0 7px 20px rgba(0,0,0,.08);transform:translateY(-2px)}.product-cover{display:block;width:100%;aspect-ratio:1;padding:16px;overflow:hidden;border:0;background:#fafafa;cursor:pointer}.product-cover img{width:100%;height:100%;object-fit:contain;transition:transform 220ms ease}.product-card:hover .product-cover img{transform:scale(1.035)}.image-placeholder{display:grid;width:100%;height:100%;place-items:center;color:#bbb;background:#f3f3f3;font-size:13px}.product-info{padding:14px 14px 12px}.product-title{display:-webkit-box;width:100%;height:42px;padding:0;overflow:hidden;border:0;color:#333;background:transparent;text-align:left;font:inherit;font-size:14px;line-height:21px;-webkit-box-orient:vertical;-webkit-line-clamp:2;cursor:pointer}.product-title:hover{color:#e1251b}.price-row{display:flex;align-items:center;justify-content:space-between;min-height:34px;margin-top:8px}.price-row strong{color:#e1251b;font-family:Arial,sans-serif;font-size:20px}.price-row small{margin-right:2px;font-size:13px}.price-row span{color:#999;font-size:12px}.card-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:11px;border-top:1px solid #f2f2f2}.card-actions .el-button{width:100%;margin:0;border-radius:2px}.state-area{display:flex;min-height:390px;flex-direction:column;align-items:center;justify-content:center;text-align:center}.state-icon{display:grid;width:70px;height:70px;place-items:center;border-radius:50%;color:#e1251b;background:#fff1f0;font-family:Arial,sans-serif;font-size:46px;line-height:1}.error-icon{font-size:32px;font-weight:700}.state-area h2{margin:18px 0 8px;color:#444;font-size:18px}.state-area p{margin:0 0 22px;color:#999;font-size:13px}.state-area .el-button{min-width:116px;border-radius:2px}.skeleton-card{padding-bottom:16px}.skeleton-image{width:100%;aspect-ratio:1}.skeleton-title{width:calc(100% - 28px);margin:14px 14px 0}.skeleton-price{width:42%;margin:13px 14px 0}
@media(max-width:900px){.product-grid,.skeleton-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:680px){.favorites-page{padding:12px 10px 28px}.favorites-panel{padding:0 12px 24px}.panel-header{min-height:78px;margin-bottom:14px}.panel-header p{display:none}.panel-header h1{font-size:19px}.product-grid,.skeleton-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 8px}.product-cover{padding:9px}.product-info{padding:10px 9px 9px}.price-row{align-items:flex-start;flex-direction:column;justify-content:center;gap:2px}.card-actions{grid-template-columns:1fr}.card-actions .el-button:first-child{display:none}}
</style>
