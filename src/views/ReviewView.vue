<template>
  <main class="review-page">
    <section class="review-shell" aria-labelledby="review-title">
      <header class="review-header">
        <button type="button" class="back-button" @click="router.push(`/orders/${orderNo}`)"><el-icon><ArrowLeft /></el-icon> 返回订单详情</button>
        <div><p>PRODUCT REVIEW</p><h1 id="review-title">发表商品评价</h1><span>分享真实使用感受，帮助更多人做出选择</span></div>
        <em>订单号：{{ orderNo }}</em>
      </header>

      <div v-if="loading" class="review-loading"><el-skeleton :rows="10" animated /></div>

      <section v-else-if="loadError" class="review-state">
        <span aria-hidden="true">!</span><h2>评价信息加载失败</h2><p>{{ loadError }}</p>
        <div><el-button type="danger" @click="loadOrder">重新加载</el-button><el-button @click="router.push('/orders')">返回我的订单</el-button></div>
      </section>

      <section v-else-if="!reviewable" class="review-state">
        <span class="muted-icon" aria-hidden="true">i</span><h2>当前订单暂不能评价</h2><p>订单完成后才能发表商品评价，请先确认收货或等待订单状态更新。</p>
        <el-button type="danger" @click="router.push(`/orders/${orderNo}`)">查看订单状态</el-button>
      </section>

      <template v-else>
        <section class="review-section product-section" aria-labelledby="product-title">
          <header><div><h2 id="product-title">评价商品</h2><p>{{ itemLocked ? '已从订单商品进入，评价对象不可更改' : '请选择本次要评价的商品' }}</p></div><span>共 {{ orderItems.length }} 件商品</span></header>

          <div v-if="itemLocked && selectedItem" class="locked-product">
            <div class="product-summary">
              <div class="product-image"><img v-if="selectedItem.image" :src="selectedItem.image" :alt="selectedItem.name" /><el-icon v-else><Picture /></el-icon></div>
              <div class="product-copy"><strong>{{ selectedItem.name }}</strong><span v-if="selectedItem.spec">{{ selectedItem.spec }}</span><small>数量 ×{{ selectedItem.quantity }}</small></div>
            </div>
            <span class="locked-label"><el-icon><Lock /></el-icon> 已锁定</span>
          </div>

          <div v-else class="product-options" role="radiogroup" aria-label="选择评价商品">
            <button v-for="item in orderItems" :key="item.orderItemId" type="button" role="radio" :aria-checked="selectedItemId === item.orderItemId" :class="['product-option', { selected: selectedItemId === item.orderItemId }]" @click="selectedItemId = item.orderItemId">
              <div class="product-summary">
                <div class="product-image"><img v-if="item.image" :src="item.image" :alt="item.name" /><el-icon v-else><Picture /></el-icon></div>
                <div class="product-copy"><strong>{{ item.name }}</strong><span v-if="item.spec">{{ item.spec }}</span><small>数量 ×{{ item.quantity }}</small></div>
              </div>
              <span class="select-mark" aria-hidden="true">✓</span>
            </button>
          </div>
        </section>

        <section class="review-section form-section" aria-labelledby="experience-title">
          <header><div><h2 id="experience-title">商品体验</h2><p>请根据实际体验进行客观评价</p></div><span><b>*</b> 为必填项</span></header>

          <el-form label-position="top" class="review-form" @submit.prevent="submitReview">
            <el-form-item required label="总体评分">
              <div class="rating-row"><el-rate v-model="form.rating" :texts="ratingTexts" show-text size="large" /><span>{{ form.rating }}.0 分</span></div>
            </el-form-item>

            <el-form-item label="评价内容">
              <el-input v-model="form.content" type="textarea" :rows="6" maxlength="500" show-word-limit resize="none" placeholder="商品质量如何？使用感受怎么样？物流和包装是否满意？写下真实体验供其他用户参考。" />
            </el-form-item>

            <el-form-item label="添加图片（选填，最多 5 张）">
              <div class="image-editor">
                <div class="image-input-row"><el-input v-model="newImageUrl" placeholder="请输入以 http:// 或 https:// 开头的图片地址" clearable @keyup.enter="addImage" /><el-button :disabled="form.images.length >= 5" @click="addImage">添加图片</el-button></div>
                <p>当前接口只接受图片 URL，多个地址提交时会自动转换为逗号分隔字符串。</p>
                <div v-if="form.images.length" class="image-list">
                  <figure v-for="(image, index) in form.images" :key="image">
                    <el-image :src="image" fit="cover" :preview-src-list="form.images" :initial-index="index"><template #error><div class="image-error">图片无法预览</div></template></el-image>
                    <button type="button" :aria-label="`删除第 ${index + 1} 张图片`" @click="removeImage(index)">×</button>
                  </figure>
                  <span>{{ form.images.length }}/5</span>
                </div>
              </div>
            </el-form-item>

            <div class="privacy-row">
              <el-checkbox v-model="form.isAnonymous">匿名评价</el-checkbox>
              <span>{{ form.isAnonymous ? '发布后将隐藏您的昵称和头像' : '评价将展示您的公开昵称和头像' }}</span>
            </div>

            <footer class="submit-bar">
              <p>提交即表示评价内容来自您的真实体验</p>
              <el-button type="danger" size="large" :loading="submitting" :disabled="!selectedItemId || !form.rating" native-type="submit">发布评价</el-button>
            </footer>
          </el-form>
        </section>
      </template>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Lock, Picture } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { createReview, getOrderDetail } from '../api/index.js'
import { normalizeOrderDetail } from '../utils/order.js'
import { buildReviewPayload, normalizeReviewImages, selectReviewItem } from '../utils/review.js'

const route = useRoute()
const router = useRouter()
const orderNo = computed(() => String(route.params.orderNo || ''))
const loading = ref(true)
const loadError = ref('')
const submitting = ref(false)
const order = ref(null)
const orderItems = ref([])
const selectedItemId = ref(null)
const newImageUrl = ref('')
const form = ref({ rating: 5, content: '', images: [], isAnonymous: false })
const ratingTexts = ['非常差', '不满意', '一般', '比较满意', '非常满意']
const requestedItemId = computed(() => route.query.orderItemId)
const itemLocked = computed(() => requestedItemId.value != null && requestedItemId.value !== '')
const selectedItem = computed(() => selectReviewItem(orderItems.value, selectedItemId.value))
const reviewable = computed(() => order.value?.status === 3 && orderItems.value.length > 0)
let requestSequence = 0

async function loadOrder() {
  const sequence = ++requestSequence
  const orderNoSnapshot = orderNo.value
  const itemIdSnapshot = requestedItemId.value
  loading.value = true
  loadError.value = ''
  order.value = null
  orderItems.value = []
  selectedItemId.value = null
  newImageUrl.value = ''
  form.value = { rating: 5, content: '', images: [], isAnonymous: false }
  try {
    const detail = normalizeOrderDetail(await getOrderDetail(orderNoSnapshot))
    if (sequence !== requestSequence || orderNo.value !== orderNoSnapshot || requestedItemId.value !== itemIdSnapshot) return
    order.value = detail
    orderItems.value = detail.items.filter((item) => item.orderItemId)
    const target = selectReviewItem(orderItems.value, itemIdSnapshot)
    if (itemLocked.value && !target) throw new Error('订单中没有找到要评价的商品，请从订单详情重新进入')
    selectedItemId.value = target?.orderItemId || null
  } catch (error) {
    if (sequence !== requestSequence || orderNo.value !== orderNoSnapshot || requestedItemId.value !== itemIdSnapshot) return
    order.value = null
    orderItems.value = []
    loadError.value = error?.message || '暂时无法加载订单商品，请稍后重试'
  } finally {
    if (sequence === requestSequence && orderNo.value === orderNoSnapshot && requestedItemId.value === itemIdSnapshot) loading.value = false
  }
}

function addImage() {
  if (!newImageUrl.value.trim()) return ElMessage.warning('请输入图片地址')
  try {
    form.value.images = normalizeReviewImages([...form.value.images, newImageUrl.value])
    newImageUrl.value = ''
  } catch (error) { ElMessage.error(error.message) }
}

function removeImage(index) {
  form.value.images.splice(index, 1)
}

async function submitReview() {
  if (submitting.value) return
  let payload
  try {
    payload = buildReviewPayload({ ...form.value, orderItemId: selectedItemId.value })
  } catch (error) {
    ElMessage.warning(error.message)
    return
  }

  submitting.value = true
  try {
    await createReview(payload)
    ElMessage.success('评价发布成功，感谢您的分享')
    await router.replace(`/orders/${orderNo.value}`)
  } catch (error) {
    ElMessage.error(error?.message || '评价发布失败，请稍后重试')
  } finally { submitting.value = false }
}

watch(() => [route.params.orderNo, route.query.orderItemId], loadOrder, { immediate: true })
</script>

<style scoped>
.review-page{min-height:calc(100vh - 136px);padding:24px 16px 54px;color:#333;background:#f5f5f5;font-family:'PingFang SC','Microsoft YaHei',Arial,sans-serif}.review-shell{width:min(1050px,100%);margin:0 auto}.review-header{position:relative;display:flex;min-height:132px;align-items:center;justify-content:space-between;padding:28px 30px;border-bottom:2px solid #e1251b;background:#fff}.review-header>div{margin-left:126px}.review-header p{margin:0 0 5px;color:#e1251b;font-size:10px;font-weight:700;letter-spacing:.17em}.review-header h1{margin:0;font-size:24px;font-weight:600}.review-header div>span{display:block;margin-top:8px;color:#999;font-size:12px}.review-header em{align-self:flex-end;color:#999;font-size:11px;font-style:normal}.back-button{position:absolute;top:31px;left:30px;display:flex;align-items:center;gap:4px;padding:7px 0;border:0;color:#777;background:transparent;font:inherit;font-size:12px;cursor:pointer}.back-button:hover{color:#e1251b}.review-loading{min-height:560px;padding:44px;background:#fff}.review-state{display:flex;min-height:520px;align-items:center;justify-content:center;flex-direction:column;margin-top:14px;border:1px solid #eee;background:#fff;text-align:center}.review-state>span{display:grid;width:66px;height:66px;place-items:center;border-radius:50%;color:#e1251b;background:#fff1f0;font-size:30px;font-weight:700}.review-state .muted-icon{color:#888;background:#f1f1f1}.review-state h2{margin:18px 0 8px;font-size:19px}.review-state p{max-width:470px;margin:0 0 22px;color:#888;font-size:13px;line-height:1.7}.review-state>div{display:flex;gap:10px}.review-section{margin-top:14px;padding:0 28px 28px;border:1px solid #eee;background:#fff}.review-section>header{display:flex;min-height:74px;align-items:center;justify-content:space-between;border-bottom:1px solid #eee}.review-section>header h2{margin:0;font-size:17px;font-weight:600}.review-section>header p{margin:7px 0 0;color:#999;font-size:11px}.review-section>header>span{color:#999;font-size:11px}.review-section>header b{color:#e1251b}.locked-product{display:flex;min-height:126px;align-items:center;justify-content:space-between;padding:18px 0}.locked-label{display:flex;align-items:center;gap:5px;padding:6px 10px;color:#777;background:#f5f5f5;font-size:11px}.product-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding-top:20px}.product-option{position:relative;min-width:0;padding:14px;overflow:hidden;border:1px solid #ddd;color:#333;background:#fff;text-align:left;font:inherit;cursor:pointer}.product-option:hover{border-color:#e99a95}.product-option.selected{border:2px solid #e1251b;padding:13px;background:#fffafa}.select-mark{position:absolute;right:-18px;bottom:-18px;width:42px;height:42px;padding:4px 0 0 8px;color:#fff;background:#e1251b;transform:rotate(45deg);font-size:10px}.product-option .select-mark{display:none}.product-option.selected .select-mark{display:block}.product-summary{display:grid;grid-template-columns:82px minmax(0,1fr);align-items:center;gap:15px;min-width:0}.product-image{display:grid;width:82px;height:82px;place-items:center;overflow:hidden;border:1px solid #eee;color:#bbb;background:#fafafa;font-size:26px}.product-image img{width:100%;height:100%;object-fit:contain}.product-copy{display:grid;gap:8px;min-width:0}.product-copy strong{display:-webkit-box;overflow:hidden;font-size:14px;font-weight:500;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:2}.product-copy span,.product-copy small{color:#999;font-size:11px}.review-form{padding-top:24px}.review-form :deep(.el-form-item__label){color:#444;font-size:14px;font-weight:600}.rating-row{display:flex;align-items:center;gap:18px}.rating-row>span{color:#e1251b;font-family:Arial;font-size:14px;font-weight:600}.image-editor{width:100%}.image-input-row{display:flex;width:min(680px,100%);gap:10px}.image-editor>p{margin:8px 0 0;color:#aaa;font-size:11px}.image-list{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:15px}.image-list figure{position:relative;width:88px;height:88px;margin:0;border:1px solid #eee;background:#fafafa}.image-list .el-image{width:100%;height:100%}.image-list figure>button{position:absolute;top:-8px;right:-8px;display:grid;width:22px;height:22px;place-items:center;border:1px solid #ddd;border-radius:50%;color:#666;background:#fff;font-size:16px;cursor:pointer}.image-list>span{align-self:flex-end;color:#999;font-size:11px}.image-error{display:grid;width:100%;height:100%;place-items:center;padding:8px;color:#aaa;font-size:10px;text-align:center}.privacy-row{display:flex;align-items:center;gap:14px;padding:18px 0;border-top:1px dashed #eee;color:#999;font-size:11px}.submit-bar{display:flex;align-items:center;justify-content:flex-end;gap:24px;margin:12px -28px -28px;padding:20px 28px;border-top:1px solid #eee;background:#fafafa}.submit-bar p{margin:0;color:#999;font-size:11px}.submit-bar .el-button{width:150px;border-radius:2px;font-weight:600}
@media(max-width:700px){.review-page{padding:10px 8px 34px}.review-header{min-height:126px;align-items:flex-start;flex-direction:column;padding:48px 16px 18px}.review-header>div{margin:0}.review-header em{align-self:flex-start;margin-top:10px}.back-button{top:14px;left:16px}.review-section{padding:0 14px 20px}.product-options{grid-template-columns:1fr}.locked-product{align-items:flex-start;flex-direction:column;gap:12px}.product-summary{grid-template-columns:68px 1fr}.product-image{width:68px;height:68px}.rating-row{align-items:flex-start;flex-direction:column;gap:8px}.image-input-row{flex-direction:column}.submit-bar{align-items:stretch;flex-direction:column;margin:12px -14px -20px;padding:16px 14px}.submit-bar p{text-align:center}.submit-bar .el-button{width:100%;margin:0}.review-state>div{width:calc(100% - 32px);flex-direction:column}.review-state .el-button{width:100%;margin:0}}
</style>
