<template>
	<view class="home-page">
		<view class="home-header">
			<view class="brand-row">
				<view class="brand-mark">JD</view>
				<view><text class="brand-name">京东商城</text><text class="brand-note">好物认真选</text></view>
			</view>
			<view class="search-bar" @tap="openProducts()">
				<image class="search-symbol" src="/static/icons/search.png" mode="aspectFit" /><text class="search-placeholder">搜索商品、品牌或店铺</text><text class="search-action">搜索</text>
			</view>
		</view>
		<view v-if="loading" class="loading-shell">
			<view class="skeleton skeleton-banner"></view>
			<view class="skeleton-row"><view v-for="item in 5" :key="item" class="skeleton skeleton-dot"></view></view>
			<view class="skeleton-grid"><view v-for="item in 4" :key="item" class="skeleton skeleton-card"></view></view>
		</view>
		<template v-else>
			<swiper v-if="banners.length" class="banner" circular autoplay :interval="4500" indicator-dots indicator-color="rgba(255,255,255,.45)" indicator-active-color="#ffffff">
				<swiper-item v-for="item in banners" :key="item.id" @tap="openDetail(item.id)">
					<view class="banner-slide"><image class="banner-image" :src="item.image" mode="aspectFill" /><view class="banner-shade"></view>
						<view class="banner-copy"><text class="banner-kicker">JD SELECT</text><text class="banner-title">{{ item.title }}</text><text class="banner-subtitle">{{ item.subtitle || '精选好物，品质生活' }}</text><text class="banner-link">查看详情 ›</text></view>
					</view>
				</swiper-item>
			</swiper>
			<view class="category-section">
				<view class="section-heading"><view><text class="section-kicker">EXPLORE</text><text class="section-title">发现好物</text></view><view class="section-link" @tap="switchCategory"><text>全部分类</text><image src="/static/icons/chevron-right.png" mode="aspectFit" /></view></view>
				<view v-if="categories.length" class="category-grid">
					<view v-for="(category, index) in categories" :key="category.id" class="category-item" @tap="openCategory(category.id)">
						<view class="category-icon" :class="`tone-${index % 5}`"><image v-if="category.icon" :src="category.icon" mode="aspectFit" /><text v-else>{{ category.name.slice(0, 1) }}</text></view>
						<text class="category-name">{{ category.name }}</text>
					</view>
				</view>
			</view>
			<view class="product-section">
				<view class="section-heading"><view><text class="section-kicker">CURATED</text><text class="section-title">为你推荐</text></view><text class="section-note">{{ products.length }} 件好物</text></view>
				<view v-if="products.length" class="product-grid"><ProductCard v-for="item in products" :key="item.id" :product="item" @select="openDetail" /></view>
				<StateView v-else title="暂时没有推荐商品" description="稍后再来看看新上架的好物" action-text="重新加载" @action="loadData" />
			</view>
		</template>
	</view>
</template>

<script>
	import ProductCard from '../../components/ProductCard.vue'
	import StateView from '../../components/StateView.vue'
	import { getCategoryTree, getProducts } from '../../api/index.js'
	import { flattenCategories, normalizeCategoryTree, normalizeProductList } from '../../utils/normalizers.js'

	export default {
		components: { ProductCard, StateView },
		data() { return { loading: true, categories: [], products: [] } },
		computed: { banners() { return this.products.filter((item) => item.image).slice(0, 4) } },
		onLoad() { this.loadData() },
		onPullDownRefresh() { this.loadData(true) },
		methods: {
			async loadData(fromPullDown = false) {
				this.loading = !fromPullDown
				const [categoryResult, productResult] = await Promise.allSettled([getCategoryTree(), getProducts({ page: 1, size: 12 })])
				if (categoryResult.status === 'fulfilled') this.categories = flattenCategories(normalizeCategoryTree(categoryResult.value)).slice(0, 10)
				if (productResult.status === 'fulfilled') this.products = normalizeProductList(productResult.value).list
				else uni.showToast({ title: productResult.reason?.message || '商品加载失败', icon: 'none' })
				this.loading = false
				if (fromPullDown) uni.stopPullDownRefresh()
			},
			openProducts(keyword = '') { uni.navigateTo({ url: `/pages/products/list${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}` }) },
			openDetail(product) { const id = typeof product === 'object' ? product.id : product; uni.navigateTo({ url: `/pages/products/detail?id=${id}` }) },
			openCategory(id) { uni.navigateTo({ url: `/pages/products/list?categoryId=${id}` }) },
			switchCategory() { uni.switchTab({ url: '/pages/category/index' }) },
		},
	}
</script>

<style scoped>
	.home-page { min-height: 100vh; padding-bottom: 40rpx; background: #f6f7f9; }
	.home-header { padding: calc(var(--status-bar-height) + 20rpx) 28rpx 24rpx; background: #fff; }
	.brand-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 22rpx; }.brand-mark { display: flex; width: 66rpx; height: 66rpx; align-items: center; justify-content: center; border-radius: 12rpx; color: #fff; background: #e1251b; font-size: 23rpx; font-weight: 800; }.brand-name,.brand-note { display: block; }.brand-name { color: #20242b; font-size: 34rpx; font-weight: 800; }.brand-note { margin-top: 4rpx; color: #9aa1aa; font-size: 20rpx; }
	.search-bar { display: flex; height: 76rpx; padding-left: 24rpx; align-items: center; overflow: hidden; border: 3rpx solid #e1251b; border-radius: 12rpx; background: #fff; }.search-symbol { width: 34rpx; height: 34rpx; flex:0 0 34rpx; }.search-placeholder { min-width: 0; flex: 1; margin-left: 12rpx; color: #a4abb4; font-size: 25rpx; }.search-action { display: flex; width: 104rpx; height: 100%; align-items: center; justify-content: center; color: #fff; background:#e1251b;font-size:25rpx;font-weight:700; }
	.banner { height: 390rpx; background: #29313d; }.banner-slide,.banner-image,.banner-shade { position: absolute; inset: 0; width: 100%; height: 100%; }.banner-shade { background: rgba(18,23,31,.54); }.banner-copy { position: absolute; top: 68rpx; left: 38rpx; display: flex; width: 62%; flex-direction: column; align-items: flex-start; }.banner-kicker { color: #ffc7c3; font-size: 20rpx; font-weight: 800; }.banner-title { display: -webkit-box; margin-top: 14rpx; overflow: hidden; color: #fff; font-size: 44rpx; font-weight: 800; line-height: 1.15; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.banner-subtitle { margin-top: 12rpx; overflow: hidden; color: rgba(255,255,255,.78); font-size: 24rpx; text-overflow: ellipsis; white-space: nowrap; }.banner-link { margin-top: 28rpx; padding: 12rpx 20rpx; border: 1rpx solid rgba(255,255,255,.46); border-radius: 8rpx; color: #fff; background: rgba(255,255,255,.12); font-size: 23rpx; }
	.category-section,.product-section { margin-top: 18rpx; padding: 28rpx; background: #fff; }.section-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 26rpx; }.section-kicker,.section-title { display: block; }.section-kicker { margin-bottom: 7rpx; color: #e1251b; font-size: 18rpx; font-weight: 800; }.section-title { color: #22262d; font-size: 34rpx; font-weight: 800; }.section-link{display:flex;align-items:center;gap:4rpx;color:#9299a3;font-size:23rpx}.section-link image{width:25rpx;height:25rpx}.section-note { color: #9299a3; font-size: 23rpx; }
	.category-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 26rpx 12rpx; }.category-item { display: flex; min-width: 0; flex-direction: column; align-items: center; }.category-icon { display: flex; width: 82rpx; height: 82rpx; align-items: center; justify-content: center; border-radius: 18rpx; color: #444b55; font-size: 30rpx; font-weight: 800; }.category-icon image { width: 52rpx; height: 52rpx; }.tone-0{background:#fff0e2}.tone-1{background:#e8f6eb}.tone-2{background:#e7f2ff}.tone-3{background:#f3eafe}.tone-4{background:#ffeaf0}.category-name { width: 100%; margin-top: 10rpx; overflow: hidden; color: #5b626c; font-size: 22rpx; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
	.product-grid,.skeleton-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 18rpx; }.loading-shell { padding: 24rpx 28rpx; }.skeleton { border-radius: 12rpx; background: #e9ecf0; animation: pulse 1.4s ease-in-out infinite; }.skeleton-banner { height: 330rpx; }.skeleton-row { display: flex; justify-content: space-around; margin: 28rpx 0; }.skeleton-dot { width: 82rpx; height: 82rpx; }.skeleton-card { height: 430rpx; }@keyframes pulse { 50% { opacity: .55; } }
</style>
