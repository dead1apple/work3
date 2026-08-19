<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { buyNow, createOrder, getAddressList, getMyCoupons, getProductDetail } from '../api/index.js'
import { useCartStore } from '../store/cart.js'
import { buildBuyNowPayload, extractOrderNo, normalizeBuyNowItem, parseBuyNowQuery } from '../utils/checkout.js'
import { calculateCheckoutTotals, formatMoney, normalizeAddressList } from '../utils/commerce.js'
import { filterUsableCoupons, getCouponValueText, normalizeCouponList } from '../utils/coupon.js'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const loading = ref(true)
const loadError = ref(false)
const loadErrorMessage = ref('')
const submitting = ref(false)
const cartUnavailable = ref(false)
const protocolDataInvalid = ref(false)
const addresses = ref([])
const addressId = ref(null)
const items = ref([])
const coupons = ref([])
const couponId = ref(null)
const remark = ref('')

const isBuyNow = computed(() => route.params.mode === 'buy-now')
const selectedAddress = computed(() => addresses.value.find((item) => item.id === addressId.value))
const goodsAmount = computed(() => items.value.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0))
const usableCoupons = computed(() => filterUsableCoupons(coupons.value, goodsAmount.value))
const selectedCoupon = computed(() => usableCoupons.value.find((item) => item.id === couponId.value))
const totals = computed(() => calculateCheckoutTotals(items.value, isBuyNow.value ? null : selectedCoupon.value))
const canSubmit = computed(() => Boolean(addressId.value && items.value.length && !cartUnavailable.value && !protocolDataInvalid.value && items.value.every((item) => Number(item.stock ?? 1) > 0)))

const loadBuyNow = async () => {
  const selection = parseBuyNowQuery(route.query)
  const [addressResult, productResult] = await Promise.all([
    getAddressList(),
    getProductDetail(selection.productId),
  ])
  addresses.value = normalizeAddressList(addressResult)
  addressId.value = addresses.value.find((item) => item.isDefault)?.id || addresses.value[0]?.id || null
  const item = normalizeBuyNowItem(productResult, selection)
  items.value = [item]
  if (item.quantity !== selection.quantity) ElMessage.warning(`购买数量已根据库存调整为 ${item.quantity} 件`)
}

const loadCartCheckout = async () => {
  const addressResult = await getAddressList()
  addresses.value = normalizeAddressList(addressResult)
  addressId.value = addresses.value.find((item) => item.isDefault)?.id || addresses.value[0]?.id || null
  try {
    coupons.value = normalizeCouponList(await getMyCoupons({ status: 0 }), 'mine').list
  } catch {
    coupons.value = []
    ElMessage.warning('优惠券暂时无法加载，可稍后重试或不使用优惠券')
  }
  try {
    await cartStore.fetchCartList()
    items.value = cartStore.checkedList
    protocolDataInvalid.value = items.value.some((item) => item.isValid === false)
  } catch {
    cartUnavailable.value = true
    items.value = []
  }
}

const loadCheckout = async () => {
  loading.value = true
  loadError.value = false
  loadErrorMessage.value = ''
  cartUnavailable.value = false
  protocolDataInvalid.value = false
  items.value = []
  coupons.value = []
  couponId.value = null
  try {
    if (isBuyNow.value) await loadBuyNow()
    else if (route.params.mode === 'cart') await loadCartCheckout()
    else throw new Error('不支持的结算方式')
  } catch (error) {
    loadError.value = true
    loadErrorMessage.value = error?.message || '结算信息加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const chooseAddress = (id) => { addressId.value = id }

const submitOrder = async () => {
  if (submitting.value) return
  if (!addressId.value) {
    ElMessage.warning('请先选择收货地址')
    return
  }
  if (!items.value.length) {
    ElMessage.warning(isBuyNow.value ? '商品信息无效，请返回商品详情重新选择' : '请选择需要结算的商品')
    return
  }
  if (protocolDataInvalid.value) {
    ElMessage.warning('购物车数据异常，请刷新后重试')
    return
  }
  if (items.value.some((item) => Number(item.stock ?? 1) <= 0)) {
    ElMessage.warning('商品库存不足，暂时无法提交订单')
    return
  }
  if (cartUnavailable.value) {
    ElMessage.warning('购物车服务暂未恢复，当前无法提交购物车订单')
    return
  }

  submitting.value = true
  try {
    const result = isBuyNow.value
      ? await buyNow(buildBuyNowPayload({ item: items.value[0], addressId: addressId.value, remark: remark.value }))
      : await createOrder({
          cartIds: items.value.map((item) => item.id),
          addressId: addressId.value,
          couponId: couponId.value || undefined,
          remark: remark.value.trim(),
        })
    const orderNo = extractOrderNo(result)
    if (!orderNo) throw new Error('订单已提交，但未返回订单号')
    ElMessage.success('订单提交成功，即将前往收银台')
    await router.replace({ path: `/payment/${orderNo}`, query: { amount: totals.value.payableAmount.toFixed(2) } })
  } catch (error) {
    ElMessage.error(error?.message || '订单提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

watch(() => route.fullPath, loadCheckout, { immediate: true })
</script>

<template>
  <main class="checkout-page">
    <section class="checkout-shell" aria-labelledby="checkout-title">
      <header class="checkout-header">
        <div>
          <p>CHECKOUT</p>
          <h1 id="checkout-title">确认订单</h1>
        </div>
        <ol class="checkout-steps" aria-label="结算进度">
          <li class="active"><span>1</span>确认订单</li>
          <li><span>2</span>在线支付</li>
          <li><span>3</span>完成购买</li>
        </ol>
      </header>

      <div v-if="loading" class="checkout-loading"><el-skeleton :rows="12" animated /></div>

      <div v-else-if="loadError" class="checkout-state">
        <span aria-hidden="true">!</span>
        <h2>结算信息加载失败</h2>
        <p>{{ loadErrorMessage }}</p>
        <div><el-button @click="router.back()">返回上一页</el-button><el-button type="danger" @click="loadCheckout">重新加载</el-button></div>
      </div>

      <template v-else>
        <el-alert v-if="cartUnavailable" class="cart-alert" title="购物车服务暂不可用，购物车结算入口已暂停；立即购买不受影响。" type="warning" :closable="false" show-icon />
        <el-alert v-if="protocolDataInvalid" class="cart-alert" title="购物车数据异常，请刷新后重试。" type="error" :closable="false" show-icon />

        <section class="checkout-section address-section" aria-labelledby="address-title">
          <div class="section-head">
            <h2 id="address-title">收货人信息</h2>
            <button type="button" @click="router.push('/address')">管理收货地址</button>
          </div>
          <div v-if="addresses.length" class="address-grid" role="radiogroup" aria-label="选择收货地址">
            <button
              v-for="address in addresses"
              :key="address.id"
              type="button"
              class="address-option"
              :class="{ selected: addressId === address.id }"
              role="radio"
              :aria-checked="addressId === address.id"
              @click="chooseAddress(address.id)"
            >
              <div class="recipient-row"><strong>{{ address.receiverName }}</strong><span>{{ address.receiverPhone }}</span><em v-if="address.isDefault">默认地址</em></div>
              <p>{{ address.fullAddress }}</p>
              <span v-if="addressId === address.id" class="selected-corner" aria-hidden="true">✓</span>
            </button>
          </div>
          <div v-else class="address-empty">
            <div><strong>还没有收货地址</strong><p>新增地址后才能提交订单</p></div>
            <el-button type="danger" @click="router.push('/address')">新增收货地址</el-button>
          </div>
        </section>

        <section class="checkout-section" aria-labelledby="goods-title">
          <div class="section-head"><h2 id="goods-title">商品清单</h2><span>{{ isBuyNow ? '立即购买' : `已选 ${items.length} 种商品` }}</span></div>
          <div class="goods-table-head" aria-hidden="true"><span>商品信息</span><span>单价</span><span>数量</span><span>小计</span></div>
          <article v-for="item in items" :key="item.skuId || item.id" class="goods-row">
            <div class="goods-info">
              <div class="goods-image"><img v-if="item.image" :src="item.image" :alt="item.name" /><span v-else>暂无图片</span></div>
              <div><h3>{{ item.name }}</h3><p>{{ item.specText || item.skuName || '默认规格' }}</p><span class="service-tag">京东配送</span></div>
            </div>
            <div class="unit-price"><strong>￥{{ formatMoney(item.price) }}</strong><del v-if="item.marketPrice > item.price">￥{{ formatMoney(item.marketPrice) }}</del></div>
            <div class="quantity">× {{ item.quantity }}<small v-if="item.stock != null">库存 {{ item.stock }}</small></div>
            <strong class="subtotal">￥{{ formatMoney(item.price * item.quantity) }}</strong>
          </article>
          <div v-if="!items.length" class="goods-empty">暂无可结算商品</div>
        </section>

        <section class="checkout-section discount-section" aria-labelledby="discount-title">
          <div class="section-head"><h2 id="discount-title">优惠与配送</h2></div>
          <div v-if="!isBuyNow" class="discount-row">
            <label for="coupon-select">优惠券</label>
            <el-select id="coupon-select" v-model="couponId" clearable :placeholder="usableCoupons.length ? '请选择可用优惠券' : '暂无满足门槛的优惠券'">
              <el-option v-for="coupon in usableCoupons" :key="coupon.id" :label="`${coupon.name} - ${getCouponValueText(coupon)}`" :value="coupon.id" />
            </el-select>
          </div>
          <div v-else class="discount-row static-row"><span>优惠券</span><p>当前立即购买接口暂不支持优惠券，可加入购物车后使用</p></div>
          <div class="discount-row static-row"><span>配送方式</span><p><b>京东快递</b>　预计下单后尽快送达　<em>免运费</em></p></div>
          <div class="remark-row"><label for="order-remark">订单备注</label><el-input id="order-remark" v-model="remark" type="textarea" :rows="2" maxlength="200" show-word-limit resize="none" placeholder="选填，请先与商家协商一致" /></div>
        </section>

        <section class="order-summary" aria-label="订单金额汇总">
          <div class="summary-lines">
            <p><span>商品金额</span><strong>￥{{ formatMoney(totals.goodsAmount) }}</strong></p>
            <p><span>运费</span><strong>￥0.00</strong></p>
            <p><span>优惠金额</span><strong class="discount-amount">-￥{{ formatMoney(totals.discountAmount) }}</strong></p>
          </div>
          <div class="payable-row"><span>应付总额：</span><strong><small>￥</small>{{ formatMoney(totals.payableAmount) }}</strong></div>
          <p v-if="selectedAddress" class="delivery-address">寄送至：{{ selectedAddress.fullAddress }}　收货人：{{ selectedAddress.receiverName }} {{ selectedAddress.receiverPhone }}</p>
          <el-button class="submit-order" type="danger" size="large" :loading="submitting" :disabled="!canSubmit" @click="submitOrder">提交订单</el-button>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.checkout-page{min-height:calc(100vh - 136px);padding:22px 16px 52px;color:#333;background:#f5f5f5;font-family:'PingFang SC','Microsoft YaHei',Arial,sans-serif}.checkout-shell{width:min(1180px,100%);margin:0 auto}.checkout-header{display:flex;align-items:center;justify-content:space-between;min-height:96px;padding:0 28px;border-bottom:2px solid #e1251b;background:#fff}.checkout-header p{margin:0 0 6px;color:#999;font-size:11px;letter-spacing:.16em}.checkout-header h1{margin:0;font-size:23px;font-weight:600}.checkout-steps{display:flex;margin:0;padding:0;list-style:none}.checkout-steps li{display:flex;position:relative;align-items:center;gap:7px;margin-left:34px;color:#aaa;font-size:12px}.checkout-steps li:not(:last-child)::after{position:absolute;top:50%;left:calc(100% + 9px);width:17px;border-top:1px solid #ddd;content:''}.checkout-steps span{display:grid;width:24px;height:24px;place-items:center;border:1px solid #ccc;border-radius:50%;font-family:Arial}.checkout-steps .active{color:#e1251b}.checkout-steps .active span{border-color:#e1251b;color:#fff;background:#e1251b}.checkout-loading{min-height:600px;padding:44px;background:#fff}.checkout-section{margin-top:14px;padding:0 28px 26px;border:1px solid #eee;background:#fff}.section-head{display:flex;align-items:center;justify-content:space-between;min-height:64px;border-bottom:1px solid #eee}.section-head h2{margin:0;color:#222;font-size:16px;font-weight:600}.section-head button{border:0;color:#e1251b;background:transparent;font:inherit;font-size:12px;cursor:pointer}.section-head button:focus-visible,.address-option:focus-visible{outline:2px solid #e1251b;outline-offset:2px}.section-head>span{color:#999;font-size:12px}.address-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding-top:20px}.address-option{position:relative;min-height:112px;padding:17px 18px;overflow:hidden;border:1px solid #ddd;color:#333;background:#fff;text-align:left;font:inherit;cursor:pointer}.address-option:hover{border-color:#f0a5a0}.address-option.selected{border:2px solid #e1251b;padding:16px 17px;background:#fffafa}.recipient-row{display:flex;align-items:center;gap:12px}.recipient-row strong{font-size:15px}.recipient-row span{color:#666;font-size:13px}.recipient-row em{padding:2px 6px;color:#fff;background:#e1251b;font-size:10px;font-style:normal}.address-option p{margin:17px 0 0;color:#666;font-size:13px;line-height:1.6}.selected-corner{position:absolute;right:-17px;bottom:-17px;width:42px;height:42px;padding:4px 0 0 8px;color:#fff;background:#e1251b;transform:rotate(45deg);font-size:11px}.address-empty{display:flex;align-items:center;justify-content:space-between;min-height:116px;padding:20px 0}.address-empty strong{font-size:15px}.address-empty p{margin:7px 0 0;color:#999;font-size:12px}.goods-table-head,.goods-row{display:grid;grid-template-columns:minmax(0,1fr) 130px 90px 140px;align-items:center}.goods-table-head{min-height:42px;color:#999;background:#fafafa;font-size:12px;text-align:center}.goods-table-head span:first-child{text-align:left;padding-left:14px}.goods-row{min-height:132px;border-bottom:1px solid #eee}.goods-row:last-child{border-bottom:0}.goods-info{display:flex;min-width:0;align-items:center;gap:15px;padding:16px 14px}.goods-image{display:grid;width:88px;height:88px;flex:0 0 88px;place-items:center;overflow:hidden;border:1px solid #eee;background:#fafafa;color:#bbb;font-size:11px}.goods-image img{width:100%;height:100%;object-fit:contain}.goods-info h3{display:-webkit-box;margin:0 0 8px;overflow:hidden;font-size:14px;font-weight:500;line-height:1.6;-webkit-box-orient:vertical;-webkit-line-clamp:2}.goods-info p{margin:0 0 9px;color:#999;font-size:12px}.service-tag{padding:2px 5px;border:1px solid #e1251b;color:#e1251b;font-size:10px}.unit-price,.quantity,.subtotal{text-align:center}.unit-price strong,.unit-price del{display:block}.unit-price strong{font-size:14px;font-weight:500}.unit-price del{margin-top:4px;color:#aaa;font-size:11px}.quantity{font-size:13px}.quantity small{display:block;margin-top:6px;color:#999}.subtotal{color:#e1251b;font-size:15px}.goods-empty{padding:50px;color:#999;text-align:center}.discount-section{padding-bottom:20px}.discount-row,.remark-row{display:grid;grid-template-columns:110px minmax(0,1fr);align-items:center;min-height:58px;border-bottom:1px dashed #eee;font-size:13px}.discount-row label,.discount-row>span,.remark-row label{font-weight:600}.discount-row .el-select{width:min(360px,100%)}.static-row p{margin:0;color:#666}.static-row b{color:#333}.static-row em{color:#e1251b;font-style:normal}.remark-row{align-items:start;padding:16px 0;border-bottom:0}.remark-row label{padding-top:9px}.remark-row .el-textarea{max-width:620px}.order-summary{position:relative;min-height:228px;margin-top:14px;padding:24px 28px 72px;border:1px solid #eee;background:#fff;text-align:right}.summary-lines{width:310px;margin-left:auto}.summary-lines p{display:flex;justify-content:space-between;margin:0 0 11px;font-size:13px}.summary-lines span{color:#666}.summary-lines strong{font-weight:500}.discount-amount{color:#e1251b}.payable-row{margin-top:20px;padding-top:16px;border-top:1px solid #eee;font-size:14px}.payable-row strong{margin-left:8px;color:#e1251b;font-family:Arial;font-size:27px}.payable-row small{font-size:15px}.delivery-address{margin:10px 0 0;color:#777;font-size:12px}.submit-order{position:absolute;right:28px;bottom:22px;width:166px;border-radius:0;font-weight:600}.cart-alert{margin-top:14px}.checkout-state{display:flex;min-height:560px;flex-direction:column;align-items:center;justify-content:center;background:#fff;text-align:center}.checkout-state>span{display:grid;width:68px;height:68px;place-items:center;border-radius:50%;color:#e1251b;background:#fff1f0;font-family:Arial;font-size:31px;font-weight:700}.checkout-state h2{margin:18px 0 8px;font-size:18px}.checkout-state p{max-width:500px;margin:0 0 22px;color:#888;font-size:13px}.checkout-state .el-button{border-radius:2px}
@media(max-width:760px){.checkout-page{padding:10px 8px 30px}.checkout-header{min-height:82px;padding:0 16px}.checkout-steps{display:none}.checkout-section{padding:0 14px 20px}.address-grid{grid-template-columns:1fr}.goods-table-head{display:none}.goods-row{grid-template-columns:1fr auto;gap:8px;padding:12px 0}.goods-info{grid-column:1/-1;padding:0}.unit-price{text-align:left}.quantity{text-align:right}.subtotal{grid-column:1/-1;text-align:right}.discount-row,.remark-row{grid-template-columns:1fr;gap:8px;padding:13px 0}.remark-row label{padding:0}.order-summary{padding:22px 14px 78px}.summary-lines{width:100%}.submit-order{right:14px;bottom:20px;width:calc(100% - 28px)}.delivery-address{line-height:1.7}.address-empty{align-items:flex-start;flex-direction:column;gap:16px}}
</style>
