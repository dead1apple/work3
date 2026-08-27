<template>
	<view class="list-page">
		<view class="search-shell"><view class="search-box"><image class="search-icon" src="/static/icons/search.png" mode="aspectFit" /><input v-model="keyword" confirm-type="search" placeholder="搜索商品" @confirm="restart" /><image v-if="keyword" class="clear" src="/static/icons/close.png" mode="aspectFit" @tap="keyword=''" /></view><button class="search-button" @tap="restart">搜索</button></view>
		<view class="sort-bar"><view v-for="item in sorts" :key="item.value" class="sort-item" :class="{active:sortBy===item.value}" @tap="changeSort(item.value)">{{ item.label }}</view></view>
		<view v-if="products.length" class="result-head"><text>商品列表</text><text>共 {{ total }} 件</text></view>
		<view v-if="products.length" class="product-grid"><ProductCard v-for="item in products" :key="item.id" :product="item" @select="openDetail" /></view>
		<StateView v-else-if="!loading" title="没有找到相关商品" description="换个关键词或分类试试" action-text="查看全部" @action="clearFilters" />
		<view v-if="loading" class="load-more">正在加载...</view><view v-else-if="products.length&&finished" class="load-more">已经到底了</view>
	</view>
</template>

<script>
	import ProductCard from '../../components/ProductCard.vue'
	import StateView from '../../components/StateView.vue'
	import { getProducts } from '../../api/index.js'
	import { normalizeProductList } from '../../utils/normalizers.js'
	export default {
		components:{ProductCard,StateView},
		data(){return{keyword:'',categoryId:'',brandId:'',sortBy:'default',page:1,size:10,total:0,products:[],loading:false,finished:false,sorts:[{label:'综合',value:'default'},{label:'销量',value:'sales'},{label:'价格升序',value:'price_asc'},{label:'价格降序',value:'price_desc'}]}},
		onLoad(options){this.keyword=decodeURIComponent(options.keyword||'');this.categoryId=options.categoryId||'';this.brandId=options.brandId||'';this.loadProducts()},
		onReachBottom(){if(!this.loading&&!this.finished)this.loadProducts()},
		onPullDownRefresh(){this.restart(true)},
		methods:{
			async loadProducts(reset=false){if(this.loading)return;if(reset){this.page=1;this.products=[];this.finished=false}this.loading=true;try{const result=normalizeProductList(await getProducts({keyword:this.keyword.trim()||undefined,categoryId:this.categoryId||undefined,brandId:this.brandId||undefined,sortBy:this.sortBy,page:this.page,size:this.size}));this.products=reset?result.list:[...this.products,...result.list];this.total=result.total;this.finished=result.list.length<this.size||this.products.length>=this.total;if(!this.finished)this.page+=1}catch(error){uni.showToast({title:error.message,icon:'none'})}finally{this.loading=false;uni.stopPullDownRefresh()}},
			restart(){this.loadProducts(true)},changeSort(value){if(this.sortBy===value)return;this.sortBy=value;this.restart()},clearFilters(){this.keyword='';this.categoryId='';this.brandId='';this.sortBy='default';this.restart()},openDetail(product){uni.navigateTo({url:`/pages/products/detail?id=${product.id}`})},
		},
	}
</script>

<style scoped>
	.list-page{min-height:100vh;padding-bottom:32rpx;background:#f5f6f8}.search-shell{display:flex;padding:18rpx 24rpx;gap:14rpx;background:#fff}.search-box{display:flex;height:70rpx;min-width:0;flex:1;padding:0 20rpx;align-items:center;border:2rpx solid #e1251b;border-radius:10rpx}.search-box input{min-width:0;flex:1;margin-left:10rpx;font-size:25rpx}.search-icon{width:32rpx;height:32rpx;flex:0 0 32rpx}.clear{width:48rpx;height:48rpx;padding:10rpx}.search-button{width:104rpx;height:70rpx;margin:0;border:0;border-radius:9rpx;color:#fff;background:#e1251b;font-size:24rpx;line-height:70rpx}.search-button::after{border:0}.sort-bar{display:grid;grid-template-columns:repeat(4,1fr);height:82rpx;border-top:1rpx solid #f0f1f3;border-bottom:1rpx solid #e8eaed;background:#fff}.sort-item{display:flex;align-items:center;justify-content:center;color:#606773;font-size:23rpx}.sort-item.active{color:#e1251b;font-weight:700}.result-head{display:flex;padding:26rpx 26rpx 18rpx;align-items:center;justify-content:space-between;color:#272c33;font-size:29rpx;font-weight:700}.result-head text:last-child{color:#969da6;font-size:22rpx;font-weight:400}.product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18rpx;padding:0 24rpx}.load-more{padding:34rpx;color:#a0a6ae;font-size:22rpx;text-align:center}
</style>
