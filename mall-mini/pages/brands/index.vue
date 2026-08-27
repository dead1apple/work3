<template>
	<view class="brand-page">
		<view class="page-head"><text class="kicker">BRAND HOUSE</text><text class="title">品牌馆</text><text class="subtitle">按品牌发现值得信赖的商品</text></view>
		<view v-if="loading" class="loading">正在加载品牌...</view>
		<StateView v-else-if="error" title="品牌加载失败" :description="error" action-text="重新加载" error @action="loadBrands" />
		<view v-else-if="brands.length" class="brand-grid"><view v-for="brand in brands" :key="brand.id" class="brand-card" @tap="openBrand(brand)"><view class="brand-logo"><image v-if="brand.logo" :src="brand.logo" mode="aspectFit" /><text v-else>{{ brand.name.slice(0,1) }}</text></view><view class="brand-copy"><text>{{ brand.name }}</text><text>{{ brand.description||'进入品牌专区浏览精选商品' }}</text></view><image class="arrow" src="/static/icons/chevron-right.png" mode="aspectFit" /></view></view>
		<StateView v-else title="暂无可浏览品牌" description="品牌上架后会在这里展示" action-text="返回首页" @action="goHome" />
	</view>
</template>

<script>
	import StateView from '../../components/StateView.vue'
	import { getBrands } from '../../api/index.js'
	import { normalizeBrandList } from '../../utils/normalizers.js'
	export default{components:{StateView},data(){return{loading:true,error:'',brands:[]}},onLoad(){this.loadBrands()},onPullDownRefresh(){this.loadBrands(true)},methods:{async loadBrands(fromPullDown=false){this.loading=!fromPullDown;this.error='';try{this.brands=normalizeBrandList(await getBrands())}catch(error){this.error=error.message||'品牌加载失败'}finally{this.loading=false;if(fromPullDown)uni.stopPullDownRefresh()}},openBrand(brand){uni.navigateTo({url:`/pages/brands/detail?id=${brand.id}`})},goHome(){uni.switchTab({url:'/pages/index/index'})}}}
</script>

<style scoped>
	.brand-page{min-height:100vh;padding-bottom:40rpx;background:#f5f6f8}.page-head{padding:32rpx 28rpx 28rpx;background:#fff}.page-head text{display:block}.kicker{color:#e1251b;font-size:18rpx;font-weight:800}.title{margin-top:7rpx;color:#252a31;font-size:40rpx;font-weight:800}.subtitle{margin-top:9rpx;color:#969da6;font-size:22rpx}.loading{display:flex;height:60vh;align-items:center;justify-content:center;color:#969da6;font-size:24rpx}.brand-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16rpx;padding:20rpx}.brand-card{position:relative;display:flex;min-width:0;min-height:250rpx;padding:22rpx 18rpx;align-items:center;flex-direction:column;border:1rpx solid #eceef1;border-radius:9rpx;background:#fff;text-align:center}.brand-logo{display:flex;width:112rpx;height:112rpx;align-items:center;justify-content:center;overflow:hidden;border:1rpx solid #eceef1;border-radius:8rpx;color:#e1251b;background:#fafbfc;font-size:35rpx;font-weight:800}.brand-logo image{width:88%;height:88%}.brand-copy{min-width:0;width:100%}.brand-copy text{display:block}.brand-copy text:first-child{margin-top:16rpx;overflow:hidden;color:#343a42;font-size:26rpx;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.brand-copy text:last-child{display:-webkit-box;margin-top:8rpx;overflow:hidden;color:#969da6;font-size:19rpx;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.arrow{position:absolute;right:13rpx;top:13rpx;width:24rpx;height:24rpx}
</style>
