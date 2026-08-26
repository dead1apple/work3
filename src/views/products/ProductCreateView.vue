<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ElAlert,
  ElButton,
  ElCascader,
  ElInput,
  ElInputNumber,
  ElImage,
  ElMessage,
  ElOption,
  ElSelect,
  ElSkeleton,
} from 'element-plus'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { useShopStore } from '../../store/shop'
import { ProductFormValidationError, useProductCreate } from './useProductCreate'
import { useProductEdit } from './useProductEdit'
import { parseImageUrls } from './product-create'
import ProductImageUpload from './ProductImageUpload.vue'

const router = useRouter()
const route = useRoute()
const shop = useShopStore()
const isEditing = computed(() => Boolean(route.params.id))
const productCreate = isEditing.value ? useProductEdit(route.params.id) : useProductCreate()

defineExpose({ productCreate })

function fieldError(path) {
  return productCreate.validationErrors.value[path]
}

function runCatalogLoad() {
  void (async () => {
    await productCreate.loadCatalogs()
    if (isEditing.value) await productCreate.loadProduct()
  })().catch(() => {})
}

function productImages() {
  return parseImageUrls(productCreate.form.imageUrls)
}

function addProductImage(url) {
  productCreate.form.imageUrls = [...productImages(), url].join('\n')
}

function removeProductImage(url) {
  productCreate.form.imageUrls = productImages().filter((item) => item !== url).join('\n')
}

async function submitProduct() {
  try {
    await productCreate.submit()
    ElMessage.success(isEditing.value ? '商品已更新并提交审核' : '商品已提交审核')
    await router.push({ name: 'merchant-products' })
  } catch (error) {
    if (error instanceof ProductFormValidationError) {
      ElMessage.warning('请检查商品表单')
    }
  }
}

onMounted(() => {
  if (!shop.hasNoShop) runCatalogLoad()
})
</script>

<template>
  <section class="product-create-view" aria-labelledby="product-create-title">
    <header class="create-heading">
      <div>
        <p class="create-kicker">NEW PRODUCT</p>
        <h1 id="product-create-title">{{ isEditing ? '编辑商品' : '新增商品' }}</h1>
        <p>
          <strong>{{ shop.shop?.shopName || '当前店铺' }}</strong>
          · {{ isEditing ? '保存后以服务端返回结果为准' : '提交后由平台审核' }}，店铺归属由服务端身份确定
        </p>
      </div>
      <router-link class="back-link" :to="{ name: 'merchant-products' }">返回商品列表</router-link>
    </header>

    <div v-if="shop.hasNoShop" class="create-state" data-testid="create-no-shop" role="status">
      <span class="state-eyebrow">SHOP REQUIRED</span>
      <h2>尚未配置店铺</h2>
      <p>当前账号尚未关联店铺，无法创建商品。请联系管理员完成店铺配置。</p>
    </div>

    <div
      v-else-if="productCreate.catalogLoading.value"
      class="create-state"
      data-testid="catalog-loading"
      aria-live="polite"
    >
      <p>正在加载分类和品牌</p>
      <el-skeleton :rows="6" animated />
    </div>

    <div
      v-else-if="isEditing && productCreate.detailLoading.value"
      class="create-state"
      data-testid="product-detail-loading"
      aria-live="polite"
    >
      <p>正在加载商品详情</p>
      <el-skeleton :rows="6" animated />
    </div>

    <div
      v-else-if="productCreate.catalogError.value"
      class="create-state create-state--error"
      data-testid="catalog-error"
      role="alert"
    >
      <span class="state-eyebrow">CATALOG UNAVAILABLE</span>
      <h2>分类和品牌加载失败</h2>
      <p>{{ productCreate.catalogError.value.message }}</p>
      <el-button
        type="primary"
        :icon="Refresh"
        data-testid="retry-catalogs"
        @click="runCatalogLoad"
      >
        重新加载
      </el-button>
    </div>

    <div
      v-else-if="isEditing && productCreate.detailError.value"
      class="create-state create-state--error"
      data-testid="product-detail-error"
      role="alert"
    >
      <span class="state-eyebrow">PRODUCT UNAVAILABLE</span>
      <h2>商品详情加载失败</h2>
      <p>{{ productCreate.detailError.value.message }}</p>
      <el-button type="primary" :icon="Refresh" @click="runCatalogLoad">重新加载</el-button>
    </div>

    <form v-else class="product-form" aria-label="新增商品表单" @submit.prevent="submitProduct">
      <el-alert
        v-if="productCreate.submitError.value"
        class="submit-alert"
        data-testid="submit-error"
        type="error"
        :title="productCreate.submitError.value.message || '商品创建失败'"
        :closable="false"
        show-icon
      />

      <section class="form-section" aria-labelledby="base-info-title">
        <div class="section-heading">
          <span>01</span>
          <div>
            <h2 id="base-info-title">基础信息</h2>
            <p>名称、叶子分类与品牌为必填项。</p>
          </div>
        </div>

        <div class="field-grid">
          <label class="form-field field-span-2">
            <span>商品名称 <b>必填</b></span>
            <el-input
              v-model="productCreate.form.name"
              aria-label="商品名称"
              maxlength="120"
              show-word-limit
              placeholder="请输入商品名称"
            />
            <small v-if="fieldError('name')" class="field-error">{{ fieldError('name') }}</small>
          </label>

          <label class="form-field field-span-2">
            <span>副标题</span>
            <el-input
              v-model="productCreate.form.subtitle"
              aria-label="商品副标题"
              placeholder="可选，用一句话概括卖点"
            />
          </label>

          <label class="form-field">
            <span>商品分类 <b>必填</b></span>
            <el-cascader
              v-model="productCreate.form.categoryPath"
              aria-label="商品分类"
              :options="productCreate.categoryOptions.value"
              :props="{ emitPath: true }"
              clearable
              placeholder="请选择叶子分类"
            />
            <small v-if="fieldError('categoryPath')" class="field-error">
              {{ fieldError('categoryPath') }}
            </small>
          </label>

          <label class="form-field">
            <span>商品品牌 <b>必填</b></span>
            <el-select
              v-model="productCreate.form.brandId"
              aria-label="商品品牌"
              filterable
              placeholder="请选择品牌"
            >
              <el-option
                v-for="brand in productCreate.brands.value"
                :key="brand.id"
                :label="brand.name"
                :value="brand.id"
              />
            </el-select>
            <small v-if="fieldError('brandId')" class="field-error">{{ fieldError('brandId') }}</small>
          </label>
        </div>
      </section>

      <section class="form-section" aria-labelledby="media-info-title">
        <div class="section-heading">
          <span>02</span>
          <div>
            <h2 id="media-info-title">图片与详情</h2>
            <p>支持 JPEG、PNG、GIF、WebP，单个文件最大 10 MB；上传后使用服务端返回 URL。</p>
          </div>
        </div>

        <div class="field-grid">
          <label class="form-field field-span-2">
            <span>主图</span>
            <ProductImageUpload v-model="productCreate.form.mainImage" label="上传主图" />
          </label>
          <label class="form-field field-span-2">
            <span>商品图片</span>
            <ProductImageUpload label="添加商品图片" @uploaded="addProductImage" />
            <div v-if="productImages().length" class="uploaded-images" aria-label="已上传商品图片">
              <div v-for="url in productImages()" :key="url" class="uploaded-image">
                <el-image :src="url" fit="cover" />
                <el-button text type="danger" :aria-label="`移除商品图片`" @click="removeProductImage(url)">移除</el-button>
              </div>
            </div>
          </label>
          <label class="form-field field-span-2">
            <span>商品详情</span>
            <el-input
              v-model="productCreate.form.detail"
              aria-label="商品详情"
              type="textarea"
              :rows="7"
              placeholder="可填写文本或后端支持的 HTML 内容"
            />
          </label>
        </div>
      </section>

      <section class="form-section" aria-labelledby="sku-info-title">
        <div class="section-heading section-heading--action">
          <span>03</span>
          <div>
            <h2 id="sku-info-title">SKU 信息</h2>
            <p>至少添加一个 SKU；规格值必须是 JSON 对象。</p>
          </div>
          <el-button type="primary" plain :icon="Plus" data-testid="add-sku" @click="productCreate.addSku">
            添加 SKU
          </el-button>
        </div>

        <p v-if="fieldError('skuList')" class="section-error">{{ fieldError('skuList') }}</p>

        <div class="sku-list">
          <article
            v-for="(sku, index) in productCreate.form.skuList"
            :key="sku.key"
            class="sku-card"
            :aria-labelledby="`sku-title-${sku.key}`"
          >
            <header>
              <h3 :id="`sku-title-${sku.key}`">SKU {{ index + 1 }}</h3>
              <el-button
                text
                type="danger"
                :icon="Delete"
                :aria-label="`删除 SKU ${index + 1}`"
                @click="productCreate.removeSku(sku.key)"
              >
                删除
              </el-button>
            </header>

            <div class="sku-grid">
              <label class="form-field">
                <span>SKU 名称 <b>必填</b></span>
                <el-input v-model="sku.skuName" :aria-label="`SKU ${index + 1} 名称`" placeholder="例如：黑色 256GB" />
                <small v-if="fieldError(`skuList.${index}.skuName`)" class="field-error">
                  {{ fieldError(`skuList.${index}.skuName`) }}
                </small>
              </label>

              <label class="form-field sku-spec-field">
                <span>规格 JSON <b>必填</b></span>
                <el-input
                  v-model="sku.specValues"
                  :aria-label="`SKU ${index + 1} 规格 JSON`"
                  placeholder='{"颜色":"黑色","容量":"256GB"}'
                />
                <small v-if="fieldError(`skuList.${index}.specValues`)" class="field-error">
                  {{ fieldError(`skuList.${index}.specValues`) }}
                </small>
              </label>

              <label class="form-field">
                <span>销售价（元）<b>必填</b></span>
                <el-input-number v-model="sku.price" :aria-label="`SKU ${index + 1} 销售价`" :min="0" :precision="2" :controls="false" />
                <small v-if="fieldError(`skuList.${index}.price`)" class="field-error">
                  {{ fieldError(`skuList.${index}.price`) }}
                </small>
              </label>

              <label class="form-field">
                <span>市场价（元）</span>
                <el-input-number v-model="sku.marketPrice" :aria-label="`SKU ${index + 1} 市场价`" :min="0" :precision="2" :controls="false" />
                <small v-if="fieldError(`skuList.${index}.marketPrice`)" class="field-error">
                  {{ fieldError(`skuList.${index}.marketPrice`) }}
                </small>
              </label>

              <label class="form-field">
                <span>库存 <b>必填</b></span>
                <el-input-number v-model="sku.stock" :aria-label="`SKU ${index + 1} 库存`" :min="0" :precision="0" :controls="false" />
                <small v-if="fieldError(`skuList.${index}.stock`)" class="field-error">
                  {{ fieldError(`skuList.${index}.stock`) }}
                </small>
              </label>

              <label class="form-field sku-image-field">
                <span>SKU 图片</span>
                <ProductImageUpload v-model="sku.image" :label="`上传 SKU ${index + 1} 图片`" />
              </label>
            </div>
          </article>
        </div>
      </section>

      <footer class="form-actions">
        <p>{{ isEditing ? '保存后以服务端的审核与状态规则为准。' : '提交即进入平台审核流程，本页不会自行设置商品状态。' }}</p>
        <div>
          <router-link class="cancel-link" :to="{ name: 'merchant-products' }">取消</router-link>
          <el-button
            native-type="button"
            type="primary"
            size="large"
            data-testid="submit-product"
            :loading="productCreate.submitting.value"
            :disabled="productCreate.submitting.value"
            @click="submitProduct"
          >
            {{ isEditing ? '保存商品' : '提交审核' }}
          </el-button>
        </div>
      </footer>
    </form>
  </section>
</template>

<style scoped>
.product-create-view {
  max-width: 1120px;
  margin: 0 auto;
}

.create-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.create-kicker,
.state-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-accent);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.16em;
}

.create-heading h1 {
  margin: 0;
  font-size: clamp(30px, 4vw, 44px);
  letter-spacing: -0.04em;
}

.create-heading > div > p:last-child {
  margin: var(--space-3) 0 0;
  color: var(--color-muted);
  line-height: 1.6;
}

.create-heading strong {
  color: var(--color-ink);
}

.back-link,
.cancel-link {
  color: var(--color-accent-strong);
  font-weight: 650;
  text-decoration: none;
}

.back-link {
  padding-top: var(--space-3);
}

.create-state,
.form-section,
.form-actions {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.create-state {
  min-height: 340px;
  padding: clamp(28px, 5vw, 56px);
  border-radius: var(--radius-large);
}

.create-state--error {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
}

.create-state h2 {
  margin: 0;
  font-size: 28px;
}

.create-state p {
  color: var(--color-muted);
}

.product-form {
  display: grid;
  gap: var(--space-5);
}

.submit-alert {
  position: sticky;
  z-index: 2;
  top: var(--space-4);
}

.form-section {
  padding: clamp(22px, 4vw, 38px);
  border-radius: var(--radius-large);
}

.section-heading {
  display: grid;
  grid-template-columns: 38px 1fr;
  align-items: start;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.section-heading--action {
  grid-template-columns: 38px 1fr auto;
}

.section-heading > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: 12px;
  font-weight: 800;
}

.section-heading h2,
.section-heading p {
  margin: 0;
}

.section-heading h2 {
  font-size: 22px;
}

.section-heading p {
  margin-top: var(--space-1);
  color: var(--color-muted);
  font-size: 13px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.field-span-2 {
  grid-column: 1 / -1;
}

.form-field {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-width: 0;
}

.form-field > span {
  color: var(--color-ink);
  font-size: 13px;
  font-weight: 650;
}

.form-field b {
  margin-left: 4px;
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 700;
}

.form-field :deep(.el-cascader),
.form-field :deep(.el-select),
.form-field :deep(.el-input-number) {
  width: 100%;
}

.field-error,
.section-error {
  color: var(--el-color-danger);
  font-size: 12px;
}

.uploaded-images { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.uploaded-image { display: grid; gap: var(--space-1); width: 92px; }
.uploaded-image :deep(.el-image) { width: 92px; height: 92px; border-radius: var(--radius-small); background: var(--color-canvas); }

.section-error {
  margin: 0 0 var(--space-4) 54px;
}

.sku-list {
  display: grid;
  gap: var(--space-4);
}

.sku-card {
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-medium);
  background: var(--color-canvas);
}

.sku-card > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.sku-card h3 {
  margin: 0;
  font-size: 15px;
}

.sku-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-4);
}

.sku-grid .form-field {
  grid-column: span 2;
}

.sku-grid .sku-spec-field,
.sku-grid .sku-image-field {
  grid-column: span 3;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-5) clamp(22px, 4vw, 38px);
  border-radius: var(--radius-large);
}

.form-actions p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.form-actions > div {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex: 0 0 auto;
}

@media (max-width: 760px) {
  .create-heading,
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .field-grid,
  .sku-grid {
    grid-template-columns: 1fr;
  }

  .field-span-2,
  .sku-grid .form-field,
  .sku-grid .sku-spec-field,
  .sku-grid .sku-image-field {
    grid-column: 1;
  }

  .section-heading--action {
    grid-template-columns: 38px 1fr;
  }

  .section-heading--action .el-button {
    grid-column: 2;
    justify-self: start;
  }

  .form-actions > div {
    justify-content: space-between;
  }
}
</style>
