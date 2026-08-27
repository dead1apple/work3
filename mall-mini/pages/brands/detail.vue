<template>
	<view class="detail-page">
		<view v-if="brand" class="brand-hero"><view class="brand-logo"><image v-if="brand.logo" :src="brand.logo" mode="aspectFit" /><text v-else>{{ brand.name.slice(0,1) }}</text></view><view><text>{{ brand.name }}</text><text>{{ brand.description||'品牌精选商品' }}</text></view></view>
		<view class="sort-bar"><view v-for="item in sorts" :key="item.value" :class="{active:sortBy===item.value}" @tap="changeSort(item.value)">{{ item.label }}</view></view>
		<view v-if="products.length" class="result-head"><text>品牌商品</text><text>共 {{ total }} 件</text></view>
		<view v-if="products.length" class="product-grid"><ProductCard v-for="item in products" :key="item.id" :product="item" @select="openProduct" /></view>
		<StateView v-else-if="error&&!loading" title="品牌专区加载失败" :description="error" action-text="重新加载" error @action="restart" />
		<StateView v-else-if="!loading" title="该品牌暂无商品" description="稍后再来看看品牌新品" action-text="查看全部商品" @action="openAll" />
		<view v-if="loading" class="loading">正在加载...</view><view v-else-if="products.length&&finished" class="loading">已经到底了</view>
	</view>
</template>

<script>
	import ProductCard from '../../components/ProductCard.vue'
	import StateView from '../../components/StateView.vue'
	import { getBrandDetail, getProducts } from '../../api/index.js'
	import { normalizeBrandDetail, normalizeProductList } from '../../utils/normalizers.js'
	export default{components:{ProductCard,StateView},data(){return{id:0,brand:null,sortBy:'default',sorts:[{label:'综合',value:'default'},{label:'销量',value:'sales'},{label:'价格升序',value:'price_asc'},{label:'价格降序',value:'price_desc'}],page:1,size:10,total:0,products:[],loading:false,finished:false,error:''}},onLoad(options){this.id=Number(options.id||0);this.loadBrand();this.loadProducts()},onReachBottom(){if(!this.loading&&!this.finished)this.loadProducts()},onPullDownRefresh(){Promise.all([this.loadBrand(),this.restart()]).finally(()=>uni.stopPullDownRefresh())},methods:{async loadBrand(){if(!this.id)return;try{this.brand=normalizeBrandDetail(await getBrandDetail(this.id));if(this.brand)uni.setNavigationBarTitle({title:this.brand.name})}catch(error){this.error=error.message||'品牌信息加载失败'}},async loadProducts(reset=false){if(this.loading||!this.id)return;if(reset){this.page=1;this.products=[];this.finished=false;this.error=''}this.loading=true;try{const result=normalizeProductList(await getProducts({brandId:this.id,sortBy:this.sortBy,page:this.page,size:this.size}));this.products=reset?result.list:[...this.products,...result.list];this.total=result.total;this.finished=result.list.length<this.size||this.products.length>=this.total;if(!this.finished)this.page+=1}catch(error){this.error=error.message||'商品加载失败'}finally{this.loading=false}},restart(){return this.loadProducts(true)},changeSort(value){if(this.sortBy===value)return;this.sortBy=value;this.restart()},openProduct(product){uni.navigateTo({url:`/pages/products/detail?id=${product.id}`})},openAll(){uni.navigateTo({url:'/pages/products/list'})}}}
</script>

<style scoped>
	.detail-page{min-height:100vh;padding-bottom:38rpx;background:#f5f6f8}.brand-hero{display:flex;min-height:210rpx;padding:30rpx;align-items:center;color:#fff;background:#333941}.brand-logo{display:flex;width:126rpx;height:126rpx;flex:0 0 126rpx;align-items:center;justify-content:center;overflow:hidden;border-radius:9rpx;color:#e1251b;background:#fff;font-size:40rpx;font-weight:800}.brand-logo image{width:88%;height:88%}.brand-hero>view:last-child{min-width:0;margin-left:24rpx}.brand-hero>view:last-child text{display:block}.brand-hero>view:last-child text:first-child{font-size:38rpx;font-weight:800}.brand-hero>view:last-child text:last-child{display:-webkit-box;margin-top:11rpx;overflow:hidden;color:rgba(255,255,255,.72);font-size:22rpx;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:2}.sort-bar{display:grid;grid-template-columns:repeat(4,1fr);height:82rpx;border-bottom:1rpx solid #e8eaed;background:#fff}.sort-bar view{display:flex;align-items:center;justify-content:center;color:#606773;font-size:22rpx}.sort-bar view.active{color:#e1251b;font-weight:700}.result-head{display:flex;padding:25rpx 25rpx 17rpx;justify-content:space-between;color:#2f353c;font-size:28rpx;font-weight:700}.result-head text:last-child{color:#969da6;font-size:21rpx;font-weight:400}.product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18rpx;padding:0 22rpx}.loading{padding:42rpx;color:#969da6;font-size:23rpx;text-align:center}
</style>
