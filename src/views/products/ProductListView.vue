<script setup>
import { onMounted } from 'vue'
import {
  ElButton,
  ElEmpty,
  ElImage,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { RouterLink } from 'vue-router'
import { useShopStore } from '../../store/shop'
import {
  PRODUCT_STATUS_OPTIONS,
  formatPriceRange,
  getProductStatus,
} from './product-list'
import { useProductList } from './useProductList'

const shop = useShopStore()
const productList = useProductList()

function run(request) {
  void request().catch(() => {})
}

function submitSearch() {
  run(productList.search)
}

function reloadProducts() {
  run(productList.load)
}

function changePage(nextPage) {
  run(() => productList.changePage(nextPage))
}

function changeSize(nextSize) {
  run(() => productList.changeSize(nextSize))
}

function getStatusAction(product) {
  if (product.status === 1) {
    return { label: '下架', nextStatus: 0 }
  }

  if (product.status === 0) {
    return { label: '上架', nextStatus: 1 }
  }

  return null
}

function isProductStatusUpdating(productId) {
  return productList.updatingProductIds.value.has(productId)
}

async function changeStatus(row) {
  const action = getStatusAction(row.product)

  if (!action || isProductStatusUpdating(row.product.id)) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认${action.label}“${row.product.name}”吗？`,
      `${action.label}商品`,
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' },
    )
  } catch {
    return
  }

  try {
    await productList.updateStatus(row.product.id, action.nextStatus)
    ElMessage.success(`${action.label}成功`)
  } catch (error) {
    ElMessage.error(error.message || `${action.label}失败，请稍后重试`)
  }
}

onMounted(reloadProducts)
</script>

<template>
  <section class="product-list-view" aria-labelledby="product-list-title">
    <header class="product-heading">
      <div>
        <p class="product-kicker">PRODUCT CATALOG</p>
        <h1 id="product-list-title">商品列表</h1>
        <p>
          <strong>{{ shop.shop?.shopName || '当前店铺' }}</strong>
          · 商品归属由服务端根据当前商家身份限定
        </p>
      </div>
      <div class="product-heading-actions">
        <router-link
          class="create-product-link"
          data-testid="create-product-link"
          :to="{ name: 'merchant-product-create' }"
        >
          新增商品
        </router-link>
        <el-button
          data-testid="reload-products"
          :icon="Refresh"
          :loading="productList.loading.value"
          @click="reloadProducts"
        >
          刷新
        </el-button>
      </div>
    </header>

    <form class="product-filters" aria-label="商品列表筛选" @submit.prevent="submitSearch">
      <label class="filter-field filter-field--search">
        <span>商品名称</span>
        <el-input
          v-model="productList.keyword.value"
          aria-label="商品名称关键字"
          clearable
          placeholder="输入商品名称关键字"
        />
      </label>
      <label class="filter-field">
        <span>商品状态</span>
        <el-select
          v-model="productList.status.value"
          aria-label="商品状态"
          clearable
          placeholder="全部状态"
        >
          <el-option
            v-for="option in PRODUCT_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </label>
      <el-button native-type="submit" type="primary" :icon="Search">查询</el-button>
    </form>

    <div
      v-if="productList.loading.value"
      class="product-state product-state--loading"
      data-testid="product-loading"
      aria-live="polite"
    >
      <span>正在加载商品</span>
      <el-skeleton :rows="5" animated />
    </div>

    <div
      v-else-if="productList.error.value"
      class="product-state product-state--error"
      data-testid="product-error"
      role="alert"
    >
      <span class="state-eyebrow">LOAD FAILED</span>
      <h2>商品列表加载失败</h2>
      <p>没有保留上一次结果，请检查网络后重新加载。</p>
      <el-button data-testid="retry-products" type="primary" @click="reloadProducts">
        重新加载
      </el-button>
    </div>

    <div
      v-else-if="productList.items.value.length === 0"
      class="product-state product-state--empty"
      data-testid="product-empty"
    >
      <el-empty description="当前店铺暂无商品" />
      <p>当前筛选条件没有返回商品，可以创建一个新商品并提交审核。</p>
    </div>

    <div v-else class="product-results">
      <div class="product-table-wrap">
        <el-table :data="productList.items.value" row-key="product.id">
          <el-table-column label="商品" min-width="330">
            <template #default="{ row }">
              <div class="product-cell">
                <el-image
                  v-if="row.product.mainImage"
                  class="product-image"
                  :src="row.product.mainImage"
                  :alt="row.product.name"
                  fit="cover"
                >
                  <template #error>
                    <div class="image-fallback">暂无图片</div>
                  </template>
                </el-image>
                <div v-else class="product-image image-fallback">暂无图片</div>
                <div class="product-copy">
                  <span class="product-id">ID {{ row.product.id }}</span>
                  <strong>{{ row.product.name }}</strong>
                  <small>{{ row.product.subtitle || '暂无副标题' }}</small>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="104">
            <template #default="{ row }">
              <el-tag :type="getProductStatus(row.product.status).type" effect="light">
                {{ getProductStatus(row.product.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="104" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="getStatusAction(row.product)"
                :data-testid="`product-status-action-${row.product.id}`"
                link
                :loading="isProductStatusUpdating(row.product.id)"
                :disabled="isProductStatusUpdating(row.product.id)"
                :type="row.product.status === 1 ? 'danger' : 'primary'"
                @click="changeStatus(row)"
              >
                {{ getStatusAction(row.product).label }}
              </el-button>
              <span v-else class="status-action-unavailable">—</span>
            </template>
          </el-table-column>
          <el-table-column label="销售价" min-width="190">
            <template #default="{ row }">
              <strong class="price-copy">
                {{ formatPriceRange(row.minPrice, row.maxPrice) }}
              </strong>
            </template>
          </el-table-column>
          <el-table-column label="总库存" prop="totalStock" width="100" />
          <el-table-column label="销量" width="86">
            <template #default="{ row }">{{ row.product.salesCount }}</template>
          </el-table-column>
          <el-table-column label="归类" min-width="150">
            <template #default="{ row }">
              <div class="id-pair">
                <span>分类 {{ row.product.categoryId }}</span>
                <span>品牌 {{ row.product.brandId }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <footer class="product-pagination">
        <span>共 {{ productList.total.value }} 件商品</span>
        <el-pagination
          :current-page="productList.page.value"
          :page-size="productList.size.value"
          :page-sizes="[2, 10, 20, 50]"
          :total="productList.total.value"
          layout="sizes, prev, pager, next"
          background
          @current-change="changePage"
          @size-change="changeSize"
        />
      </footer>
    </div>
  </section>
</template>

<style scoped>
.product-list-view {
  max-width: 1320px;
  margin: 0 auto;
}

.product-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
}

.product-kicker,
.state-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-accent);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.16em;
}

.product-heading h1 {
  margin: 0;
  font-size: clamp(30px, 4vw, 44px);
  letter-spacing: -0.04em;
}

.product-heading > div > p:last-child {
  margin: var(--space-3) 0 0;
  color: var(--color-muted);
  line-height: 1.6;
}

.product-heading > div > p strong {
  color: var(--color-ink);
}

.product-heading-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.create-product-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 15px;
  border: 1px solid var(--color-accent);
  border-radius: var(--el-border-radius-base);
  background: var(--color-accent);
  color: #fff;
  font-size: 14px;
  text-decoration: none;
}

.create-product-link:hover,
.create-product-link:focus-visible {
  background: var(--color-accent-strong);
}

.product-filters {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 190px auto;
  align-items: end;
  gap: var(--space-4);
  margin-top: var(--space-8);
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-medium);
  background: var(--color-surface);
}

.filter-field {
  display: grid;
  gap: var(--space-2);
}

.filter-field > span {
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 650;
}

.product-state,
.product-results {
  margin-top: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-large);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.product-state {
  min-height: 360px;
  padding: clamp(28px, 5vw, 56px);
}

.product-state--loading > span {
  display: block;
  margin-bottom: var(--space-6);
  color: var(--color-muted);
}

.product-state--error {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
}

.product-state--error h2 {
  margin: 0;
  font-size: 28px;
}

.product-state--error p,
.product-state--empty > p {
  color: var(--color-muted);
}

.product-state--error .el-button {
  margin-top: var(--space-3);
}

.product-state--empty {
  text-align: center;
}

.product-table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-large) var(--radius-large) 0 0;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.product-image {
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  border-radius: var(--radius-small);
  background: var(--color-canvas);
}

.image-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--color-muted);
  font-size: 11px;
}

.product-copy {
  display: grid;
  min-width: 0;
  gap: var(--space-1);
}

.product-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-copy small,
.product-id {
  color: var(--color-muted);
}

.product-id {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.price-copy {
  color: var(--color-accent-strong);
  font-variant-numeric: tabular-nums;
}

.id-pair {
  display: grid;
  gap: var(--space-1);
  color: var(--color-muted);
  font-size: 12px;
}

.status-action-unavailable {
  color: var(--color-muted);
}

.product-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  padding: var(--space-5);
  border-top: 1px solid var(--color-line);
}

.product-pagination > span {
  color: var(--color-muted);
  font-size: 13px;
}

@media (max-width: 760px) {
  .product-heading,
  .product-pagination {
    align-items: stretch;
    flex-direction: column;
  }

  .product-heading-actions {
    align-items: stretch;
  }

  .product-filters {
    grid-template-columns: 1fr;
  }

  .product-pagination {
    overflow-x: auto;
  }
}
</style>
