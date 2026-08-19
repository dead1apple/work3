<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cart.js'
import {
  createCartLoadState,
  createQuantityChangeHandler,
  createToggleItemHandler,
  loadCartWithRetryState,
} from '../utils/cart.js'

const cartStore = useCartStore()
const router = useRouter()
const allChecked = computed(() => cartStore.cartList.length > 0 && cartStore.cartList.every((item) => item.checked))
const formatPrice = (value) => Number(value || 0).toFixed(2)
const cartLoadState = reactive(createCartLoadState())
const quantityUpdatingIds = ref(new Set())

const isQuantityUpdating = (id) => quantityUpdatingIds.value.has(id)
const setQuantityUpdating = (id, updating) => {
  const next = new Set(quantityUpdatingIds.value)
  if (updating) next.add(id)
  else next.delete(id)
  quantityUpdatingIds.value = next
}

const loadCart = async () => {
  await loadCartWithRetryState({
    state: cartLoadState,
    fetchCartList: cartStore.fetchCartList.bind(cartStore),
  })
}

const retryLoadCart = () => {
  loadCart()
}

const changeQuantity = createQuantityChangeHandler({
  isQuantityUpdating,
  setQuantityUpdating,
  updateQuantity: cartStore.updateQuantity.bind(cartStore),
  refetchCart: loadCart,
  onSuccess: () => ElMessage.success('数量已更新'),
  onError: (error) => ElMessage.error(error.message || '数量更新失败'),
})

const removeItem = async (item) => {
  try {
    await cartStore.removeFromCart(item.id)
    ElMessage.success('商品已删除')
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const toggleItem = createToggleItemHandler({
  toggleCheck: cartStore.toggleCheck.bind(cartStore),
  onError: (error) => ElMessage.error(error.message || '选中状态更新失败'),
})

const toggleAll = async (checked) => {
  try {
    await cartStore.toggleAllCheck(checked)
  } catch (error) {
    ElMessage.error(error.message || '全选状态更新失败')
  }
}

const checkout = () => {
  if (!cartStore.checkedList.length) {
    ElMessage.warning('请先选择要结算的商品')
    return
  }
  router.push('/checkout/cart')
}

onMounted(loadCart)
</script>

<template>
  <section class="cart-page">
    <div class="page-heading"><div><p class="eyebrow">MY BAG</p><h1>购物车</h1></div><span class="item-count">共 {{ cartStore.totalCount }} 件商品</span></div>
    <el-skeleton v-if="cartLoadState.initialLoading" :rows="5" animated />
    <el-result
      v-else-if="cartLoadState.loadError"
      icon="warning"
      title="购物车加载失败"
      :sub-title="`${cartLoadState.loadError}。请重试刷新当前账号的购物车。`"
    >
      <template #extra>
        <el-button type="primary" :loading="cartLoadState.initialLoading" @click="retryLoadCart">重试</el-button>
      </template>
    </el-result>
    <el-empty v-else-if="!cartStore.cartList.length" description="购物车是空的，快去逛逛吧" />
    <template v-else>
      <el-table :data="cartStore.cartList" class="cart-table" row-key="id">
        <el-table-column label="商品" min-width="330">
          <template #default="{ row }"><div class="product-cell"><el-image class="product-image" :src="row.image" fit="cover" /><div><h2>{{ row.name }}</h2><p v-if="row.skuName">{{ row.skuName }}</p></div></div></template>
        </el-table-column>
        <el-table-column label="单价" width="130"><template #default="{ row }"><span class="unit-price">￥{{ formatPrice(row.price) }}</span></template></el-table-column>
        <el-table-column label="数量" width="180"><template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" :max="99" size="small" :disabled="isQuantityUpdating(row.id)" @change="(currentValue, previousValue) => changeQuantity(row, currentValue, previousValue)" /></template></el-table-column>
        <el-table-column label="小计" width="140"><template #default="{ row }"><strong class="subtotal">￥{{ formatPrice(row.price * row.quantity) }}</strong></template></el-table-column>
        <el-table-column label="操作" width="100"><template #default="{ row }"><el-button link type="danger" size="small" @click="removeItem(row)">删除</el-button></template></el-table-column>
        <el-table-column width="60" align="center"><template #header><el-checkbox :model-value="allChecked" @change="toggleAll" /></template><template #default="{ row }"><el-checkbox :model-value="row.checked" @change="(checked) => toggleItem(row, checked)" /></template></el-table-column>
      </el-table>

      <div class="cart-summary">
        <el-checkbox :model-value="allChecked" @change="toggleAll">全选</el-checkbox>
        <div class="summary-right"><span>已选 {{ cartStore.checkedList.length }} 件</span><strong>合计：<em>￥{{ formatPrice(cartStore.totalPrice) }}</em></strong><el-button type="primary" size="large" @click="checkout">去结算</el-button></div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.cart-page { padding-bottom: 28px; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; letter-spacing: 1px; }.page-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:24px}.eyebrow{margin:0 0 7px;color:#e1251b;font-size:11px;font-weight:800;letter-spacing:.18em}.page-heading h1{margin:0;color:#20242b;font-size:clamp(28px,4vw,42px);letter-spacing:-.06em}.item-count{color:#929aa6;font-size:13px}.cart-table{overflow:hidden;border:1px solid #edf0f3;border-radius:18px}.product-cell{display:flex;align-items:center;gap:14px}.product-image{width:80px;height:80px;flex:0 0 80px;border-radius:10px;background:#f5f6f7}.product-cell h2{margin:0;color:#333a45;font-size:14px;font-weight:600;line-height:1.6}.product-cell p{margin:5px 0 0;color:#969eaa;font-size:12px}.unit-price{color:#5d6672;font-size:14px}.subtotal{color:#e1251b;font-size:15px}.cart-summary{position:sticky;bottom:0;z-index:2;display:flex;align-items:center;justify-content:space-between;margin-top:18px;padding:16px 20px;border:1px solid #edf0f3;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 -8px 24px rgba(31,41,55,.06);backdrop-filter:blur(14px)}.summary-right{display:flex;align-items:center;gap:24px;color:#7d8794;font-size:13px}.summary-right strong{color:#4c5560;font-size:14px}.summary-right em{color:#e1251b;font-size:24px;font-style:normal}.summary-right .el-button{min-width:120px;border-radius:9px}@media(max-width:760px){.cart-table{overflow-x:auto}.cart-summary{align-items:flex-start;flex-direction:column;gap:16px}.summary-right{width:100%;justify-content:space-between;gap:10px}.summary-right em{font-size:20px}.summary-right .el-button{min-width:100px}}@media(max-width:480px){.item-count{display:none}.product-image{width:58px;height:58px;flex-basis:58px}.product-cell{gap:8px}.product-cell h2{font-size:12px}.summary-right span{display:none}}
</style>
