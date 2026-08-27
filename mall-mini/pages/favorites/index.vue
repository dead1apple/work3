<template>
	<view class="favorites-page">
		<view class="page-head"><view><text class="kicker">WISHLIST</text><text class="title">我的收藏</text></view><text v-if="items.length">{{ items.length }} 件商品</text></view>
		<view v-if="items.length" class="product-grid"><view v-for="item in items" :key="item.productId" class="favorite-card"><view @tap="openDetail(item.productId)"><image v-if="item.image" :src="item.image" mode="aspectFill" /><view v-else class="image-placeholder">JD</view><text class="name">{{ item.title }}</text><view class="meta"><text>¥{{ formatPrice(item.price) }}</text><text v-if="item.sales">已售 {{ item.sales }}</text></view></view><button @tap="remove(item)">取消收藏</button></view></view>
		<StateView v-else-if="!loading" title="收藏夹还是空的" description="喜欢的商品可以留在这里" action-text="去逛逛" @action="goShopping" />
		<view v-else class="loading">正在加载收藏...</view>
	</view>
</template>

<script>
	import StateView from '../../components/StateView.vue'
	import {getFavorites,getProductDetail,removeFavorite} from '../../api/index.js'
	import {formatMoney} from '../../utils/format.js'
	import {normalizeFavoriteList,normalizeProductDetail} from '../../utils/normalizers.js'
	export default{
		components:{StateView},data(){return{loading:true,items:[]}},onShow(){this.loadFavorites()},
		methods:{formatPrice:formatMoney,async loadFavorites(){this.loading=true;try{const base=normalizeFavoriteList(await getFavorites());this.items=await Promise.all(base.map(async(item)=>{if(item.image&&item.title!=='商品信息暂不可用')return item;try{const detail=normalizeProductDetail(await getProductDetail(item.productId));return{...item,title:detail.title,image:detail.images[0]||'',price:detail.price,sales:detail.sales}}catch{return item}}))}catch(error){uni.showToast({title:error.message,icon:'none'})}finally{this.loading=false}},remove(item){uni.showModal({title:'取消收藏',content:'确定不再收藏这件商品吗？',confirmColor:'#e1251b',success:async(result)=>{if(!result.confirm)return;try{await removeFavorite(item.productId);this.items=this.items.filter((entry)=>entry.productId!==item.productId);uni.showToast({title:'已取消收藏',icon:'success'})}catch(error){uni.showToast({title:error.message,icon:'none'})}}})},openDetail(id){uni.navigateTo({url:`/pages/products/detail?id=${id}`})},goShopping(){uni.switchTab({url:'/pages/index/index'})}},
	}
</script>

<style scoped>
	.favorites-page{min-height:100vh;padding-bottom:36rpx;background:#f5f6f8}.page-head{display:flex;padding:34rpx 28rpx 26rpx;align-items:flex-end;justify-content:space-between;background:#fff}.kicker,.title{display:block}.kicker{color:#e1251b;font-size:18rpx;font-weight:800}.title{margin-top:7rpx;color:#22272e;font-size:40rpx;font-weight:800}.page-head>text{color:#969da6;font-size:22rpx}.product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16rpx;padding:20rpx}.favorite-card{overflow:hidden;border:1rpx solid #ebeef1;border-radius:11rpx;background:#fff}.favorite-card image,.image-placeholder{width:100%;height:330rpx}.image-placeholder{display:flex;align-items:center;justify-content:center;color:#fff;background:#d9dde2;font-size:38rpx;font-weight:800}.name{display:-webkit-box;min-height:70rpx;margin:18rpx 16rpx 0;overflow:hidden;color:#333940;font-size:25rpx;line-height:35rpx;-webkit-box-orient:vertical;-webkit-line-clamp:2}.meta{display:flex;margin:14rpx 16rpx 18rpx;align-items:flex-end;justify-content:space-between}.meta text:first-child{color:#e1251b;font-size:31rpx;font-weight:800}.meta text:last-child{color:#9aa1aa;font-size:20rpx}.favorite-card button{height:62rpx;margin:0 14rpx 16rpx;border:1rpx solid #e0e3e7;border-radius:7rpx;color:#777f89;background:#fff;font-size:21rpx;line-height:62rpx}.favorite-card button::after{border:0}.loading{display:flex;height:60vh;align-items:center;justify-content:center;color:#969da6;font-size:24rpx}
</style>
