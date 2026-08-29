<template>
  <section class="logistics-map-card">
    <header class="map-header">
      <h2>物流地图</h2>
      <span class="map-subtitle">包裹目的地：{{ order.fullAddress || '—' }}</span>
    </header>
    <div class="map-body">
      <div class="map-stage">
        <div ref="mapRef" class="map-container" aria-label="买卖双方位置地图"></div>
        <div v-if="mapState !== 'ready'" class="map-overlay">
          <template v-if="mapState === 'loading'">
            <span class="overlay-icon" aria-hidden="true">⏳</span>
            <p>地图加载中…</p>
          </template>
          <template v-else>
            <span class="overlay-icon" aria-hidden="true">📍</span>
            <p>{{ mapState === 'geocode-error' ? '未能精确定位收货地址，已展示默认区域' : '地图加载失败，请检查网络后重试' }}</p>
            <el-button v-if="mapState === 'script-error'" size="small" @click="initMap">重新加载</el-button>
          </template>
        </div>
      </div>
      <aside class="map-aside">
        <p class="progress-text">{{ progressText }}</p>
        <div class="party-block">
          <h3><span class="party-dot party-dot--buyer" aria-hidden="true"></span>买家信息</h3>
          <dl>
            <dt>收货人</dt>
            <dd>{{ order.receiverName || '—' }} {{ maskPhone(order.receiverPhone) }}</dd>
            <dt>收货地址</dt>
            <dd>{{ order.fullAddress || '—' }}</dd>
          </dl>
        </div>
        <div class="party-block">
          <h3><span class="party-dot party-dot--seller" aria-hidden="true"></span>卖家信息</h3>
          <dl>
            <dt>店铺</dt>
            <dd>{{ sellerShop?.shopName || `店铺 ID：${order.shopId || '—'}` }}</dd>
            <dt>发货地址</dt>
            <dd>{{ sellerShop?.address || '—' }}</dd>
          </dl>
          <p v-if="!sellerShop" class="party-note">卖家位置暂不可见，仅展示店铺 ID</p>
        </div>
        <div class="party-block">
          <h3>物流信息</h3>
          <dl>
            <dt>物流公司</dt>
            <dd>{{ order.logisticsCompany || '—' }}</dd>
            <dt>物流单号</dt>
            <dd>
              <span class="tracking-no">{{ order.logisticsNo || '—' }}</span>
              <button v-if="order.logisticsNo" type="button" class="copy-button" @click="copyTrackingNo">复制</button>
            </dd>
            <dt>发货时间</dt>
            <dd>{{ order.deliveryTime || '—' }}</dd>
          </dl>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getShopMapPoints } from '../../api/index.js'
import { loadAMap } from '../../utils/amap.js'
import { readPayloadList } from '../../utils/response.js'

const props = defineProps({
  order: { type: Object, required: true },
})

const DEFAULT_CENTER = [116.397428, 39.90923]
const GEOCODE_TIMEOUT = 10000
const mapRef = ref(null)
const mapState = ref('loading')
const sellerShop = ref(null)
let mapInstance = null
let infoWindowInstance = null
let buyerMarker = null
let sellerMarker = null
let routeLine = null
let buyerPosition = null
let initSequence = 0
let geocodeTimer = null

const STATUS_PROGRESS = {
  0: '等待付款，付款后商家将尽快发货',
  1: '商家备货中，商品尚未发出',
  2: '包裹配送中，正在发往收货地址',
  3: '包裹已签收，订单已完成',
  4: '订单已取消，物流已停止',
  5: '订单已退款，物流已停止',
}

const progressText = computed(() => STATUS_PROGRESS[Number(props.order?.status)] || '物流状态更新中')

function maskPhone(phone) {
  const value = String(phone || '')
  return /^\d{11}$/.test(value) ? `${value.slice(0, 3)}****${value.slice(-4)}` : (value || '—')
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}

async function copyTrackingNo() {
  try {
    await navigator.clipboard.writeText(String(props.order.logisticsNo))
    ElMessage.success('物流单号已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

function clearGeocodeTimer() {
  if (geocodeTimer) {
    clearTimeout(geocodeTimer)
    geocodeTimer = null
  }
}

function destroyMap() {
  clearGeocodeTimer()
  buyerMarker = null
  sellerMarker = null
  routeLine = null
  buyerPosition = null
  infoWindowInstance = null
  try {
    mapInstance?.destroy()
  } catch {
    /* 地图实例可能未创建成功 */
  }
  mapInstance = null
}

function parseLocation(location) {
  const [lng, lat] = String(location || '').split(',').map(Number)
  return Number.isFinite(lng) && Number.isFinite(lat) && lng !== 0 && lat !== 0 ? [lng, lat] : null
}

function markerContent(type, label) {
  return `<div class="jd-map-marker jd-map-marker--${type}"><span class="jd-map-marker__label">${label}</span><i>${type === 'buyer' ? '收' : '发'}</i></div>`
}

function infoWindowContent(type) {
  if (type === 'buyer') {
    return `<div class="jd-map-infowindow"><h4>买家收货点</h4><p><b>${escapeHtml(props.order.receiverName || '买家')}</b> ${escapeHtml(maskPhone(props.order.receiverPhone))}</p><p>${escapeHtml(props.order.fullAddress)}</p></div>`
  }
  return `<div class="jd-map-infowindow"><h4>卖家发货点</h4><p><b>${escapeHtml(sellerShop.value?.shopName || `店铺 ${props.order.shopId}`)}</b></p><p>${escapeHtml(sellerShop.value?.address || '发货地址未提供')}</p></div>`
}

function attachMarkerEvents(type, marker, position) {
  marker.on('click', () => {
    if (!mapInstance) return
    if (!infoWindowInstance) infoWindowInstance = new window.AMap.InfoWindow({ offset: new window.AMap.Pixel(0, -46), isCustom: false })
    infoWindowInstance.setContent(infoWindowContent(type))
    infoWindowInstance.open(mapInstance, position)
  })
}

function refreshRoute() {
  if (!mapInstance) return
  if (buyerMarker && sellerMarker && buyerPosition && sellerMarker.getPosition() && !routeLine) {
    routeLine = new window.AMap.Polyline({
      path: [sellerMarker.getPosition(), buyerPosition],
      strokeColor: '#e1251b',
      strokeWeight: 3,
      strokeOpacity: 0.75,
      strokeStyle: 'dashed',
      cursor: 'pointer',
    })
    mapInstance.add(routeLine)
  }
  if (buyerMarker && sellerMarker) {
    mapInstance.setFitView([sellerMarker, buyerMarker], false, [70, 70, 70, 70])
  } else if (buyerPosition) {
    mapInstance.setZoomAndCenter(15, buyerPosition)
  }
}

async function loadSellerShop() {
  let shop = null
  try {
    const shops = readPayloadList(await getShopMapPoints())
    shop = shops.find((item) => Number(item?.id) === Number(props.order.shopId)) || null
  } catch {
    shop = null
  }
  sellerShop.value = shop
  const position = parseLocation(shop?.location)
  if (!shop || !position || !mapInstance || !window.AMap) return
  try {
    sellerMarker = new window.AMap.Marker({
      position,
      anchor: 'bottom-center',
      content: markerContent('seller', escapeHtml(shop.shopName || '卖家发货点')),
      zIndex: 60,
    })
    attachMarkerEvents('seller', sellerMarker, position)
    mapInstance.add(sellerMarker)
    refreshRoute()
  } catch {
    sellerMarker = null
  }
}

async function initMap() {
  const sequence = ++initSequence
  mapState.value = 'loading'
  destroyMap()
  sellerShop.value = null

  let AMap
  try {
    AMap = await loadAMap()
  } catch {
    if (sequence === initSequence) mapState.value = 'script-error'
    return
  }
  if (sequence !== initSequence || !mapRef.value) return

  try {
    mapInstance = new AMap.Map(mapRef.value, { zoom: 11, center: DEFAULT_CENTER, viewMode: '2D', zooms: [4, 18] })
  } catch {
    mapState.value = 'script-error'
    return
  }

  loadSellerShop()

  if (!props.order.fullAddress) {
    mapState.value = 'geocode-error'
    return
  }

  AMap.plugin('AMap.Geocoder', () => {
    if (sequence !== initSequence) return
    clearGeocodeTimer()
    geocodeTimer = setTimeout(() => {
      if (sequence === initSequence && mapState.value === 'loading') mapState.value = 'geocode-error'
    }, GEOCODE_TIMEOUT)
    const geocoder = new AMap.Geocoder({ city: '全国' })
    geocoder.getLocation(props.order.fullAddress, (status, result) => {
      if (sequence !== initSequence || !mapInstance) return
      clearGeocodeTimer()
      const location = result?.geocodes?.[0]?.location
      if (status !== 'complete' || !location) {
        mapState.value = 'geocode-error'
        return
      }
      buyerPosition = [location.lng, location.lat]
      try {
        buyerMarker = new AMap.Marker({
          position: buyerPosition,
          anchor: 'bottom-center',
          content: markerContent('buyer', '买家收货点'),
          zIndex: 80,
        })
        attachMarkerEvents('buyer', buyerMarker, buyerPosition)
        mapInstance.add(buyerMarker)
      } catch {
        mapState.value = 'geocode-error'
        return
      }
      mapState.value = 'ready'
      refreshRoute()
    })
  })
}

watch(() => props.order?.fullAddress, initMap, { immediate: true })

onBeforeUnmount(destroyMap)
</script>

<style scoped>
.logistics-map-card { margin-top: 16px; border: 1px solid #e8e8e8; background: #fff; }
.map-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; min-height: 60px; padding: 0 22px; border-bottom: 1px solid #eee; }
.map-header h2 { margin: 0; font-size: 16px; font-weight: 600; }
.map-subtitle { overflow: hidden; color: #999; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.map-body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; }
.map-stage { position: relative; height: 480px; border-right: 1px solid #eee; }
.map-container { width: 100%; height: 100%; background: #f2f4f7; }
.map-overlay { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #777; font-size: 13px; text-align: center; background: rgba(242, 244, 247, .92); }
.map-overlay .overlay-icon { font-size: 28px; }
.map-overlay p { margin: 0; }
.map-aside { max-height: 480px; padding: 18px 20px; overflow-y: auto; }
.progress-text { margin: 0 0 14px; padding: 9px 12px; border-radius: 6px; color: #e1251b; background: #fff1f0; font-size: 13px; }
.party-block { padding: 12px 0; border-top: 1px solid #f4f4f4; }
.party-block h3 { display: flex; align-items: center; gap: 7px; margin: 0 0 10px; font-size: 14px; font-weight: 600; }
.party-dot { width: 9px; height: 9px; border-radius: 50%; }
.party-dot--buyer { background: #e1251b; box-shadow: 0 0 0 3px rgba(225, 37, 27, .15); }
.party-dot--seller { background: #f7a21b; box-shadow: 0 0 0 3px rgba(247, 162, 27, .18); }
.party-block dl { display: grid; grid-template-columns: 64px 1fr; gap: 9px 10px; margin: 0; font-size: 13px; line-height: 1.55; }
.party-block dt { color: #999; }
.party-block dd { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; color: #555; overflow-wrap: anywhere; }
.party-note { margin: 9px 0 0; color: #b0b0b0; font-size: 12px; }
.tracking-no { overflow-wrap: anywhere; }
.copy-button { padding: 1px 10px; border: 1px solid #e3e3e3; border-radius: 999px; color: #e1251b; background: #fff; cursor: pointer; font: inherit; font-size: 12px; }
.copy-button:hover { border-color: #e1251b; }
.copy-button:focus-visible { outline: 2px solid #e1251b; outline-offset: 2px; }
@media (max-width: 850px) {
  .map-body { grid-template-columns: 1fr; }
  .map-stage { height: 340px; border-right: 0; border-bottom: 1px solid #eee; }
  .map-aside { max-height: none; }
}
</style>

<style>
/* 高德地图标记由运行时动态插入 DOM，无法命中 scoped 属性，故使用全局样式并加前缀隔离 */
.jd-map-marker { --marker-color: #e1251b; position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; }
.jd-map-marker--seller { --marker-color: #f7a21b; }
.jd-map-marker::before { content: ''; position: absolute; bottom: 0; left: 50%; width: 36px; height: 36px; margin-left: -18px; border-radius: 50%; background: var(--marker-color); opacity: .3; animation: jd-marker-pulse 1.8s ease-out infinite; pointer-events: none; }
.jd-map-marker i { position: relative; display: grid; width: 36px; height: 36px; place-items: center; border: 3px solid #fff; border-radius: 50%; color: #fff; background: var(--marker-color); box-shadow: 0 4px 10px rgba(0, 0, 0, .28); font-size: 15px; font-style: normal; font-weight: 700; }
.jd-map-marker__label { padding: 2px 9px; border-radius: 999px; color: #333; background: rgba(255, 255, 255, .96); box-shadow: 0 2px 8px rgba(0, 0, 0, .16); font-size: 12px; line-height: 1.5; white-space: nowrap; }
.jd-map-marker--buyer .jd-map-marker__label { color: #e1251b; }
.jd-map-marker--seller .jd-map-marker__label { color: #b06e00; }
@keyframes jd-marker-pulse { 0% { transform: scale(1); opacity: .35; } 100% { transform: scale(2); opacity: 0; } }
.jd-map-infowindow { min-width: 210px; max-width: 280px; padding: 4px 2px; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.jd-map-infowindow h4 { margin: 0 0 7px; color: #1f2329; font-size: 14px; }
.jd-map-infowindow p { margin: 4px 0; color: #555; font-size: 12px; line-height: 1.6; }
.jd-map-infowindow b { color: #333; }
</style>
