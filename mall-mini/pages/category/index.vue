<template>
	<view class="category-page">
		<view class="category-search" @tap="openProducts()"><image src="/static/icons/search.png" mode="aspectFit" /><text>搜索分类中的商品</text></view>
		<view v-if="loading" class="category-loading"><text>正在加载分类...</text></view>
		<view v-else-if="categories.length" class="category-layout">
			<scroll-view class="category-nav" scroll-y><view v-for="item in navigation" :key="item.id" class="nav-item" :class="{ active: item.id === selectedId, child: item.depth > 0 }" @tap="selectCategory(item)"><text>{{ item.depth ? `· ${item.name}` : item.name }}</text></view></scroll-view>
			<scroll-view class="category-content" scroll-y>
				<view class="category-heading"><text class="kicker">CATEGORY</text><text class="title">{{ selected?.name }}</text></view>
				<view class="subsection"><view class="subsection-head"><text>细分品类</text><text @tap="openProducts(selectedId)">查看全部 ›</text></view>
					<view class="children-grid"><view v-for="(child,index) in visibleChildren" :key="child.id" class="child-item" @tap="openProducts(child.id)"><view class="child-icon" :class="`tone-${index % 4}`"><image v-if="child.icon" :src="child.icon" mode="aspectFit" /><text v-else>{{ child.name.slice(0,1) }}</text></view><text>{{ child.name }}</text></view></view>
				</view>
				<view class="subsection products-block"><view class="subsection-head"><text>推荐商品</text><text>{{ products.length }} 件</text></view><view v-if="products.length" class="product-grid"><ProductCard v-for="item in products" :key="item.id" :product="item" @select="openDetail" /></view><StateView v-else title="该分类暂无商品" description="试试左侧其他分类" /></view>
			</scroll-view>
		</view>
		<StateView v-else title="暂无可浏览分类" action-text="重新加载" @action="loadCategories" />
	</view>
</template>

<script>
	import ProductCard from '../../components/ProductCard.vue'
	import StateView from '../../components/StateView.vue'
	import { getCategoryTree, getProducts } from '../../api/index.js'
	import { flattenCategories, normalizeCategoryTree, normalizeProductList } from '../../utils/normalizers.js'
	export default {
		components:{ ProductCard, StateView },
		data(){ return { loading:true, categories:[], selectedId:0, products:[] } },
		computed:{ navigation(){ return flattenCategories(this.categories) }, selected(){ return this.navigation.find((item)=>item.id===this.selectedId)||null }, visibleChildren(){ return this.selected?.children?.length ? this.selected.children : this.selected ? [this.selected] : [] } },
		onLoad(options){ this.pendingCategoryId=Number(options.categoryId||0); this.loadCategories() },
		methods:{
			async loadCategories(){ this.loading=true; try{ this.categories=normalizeCategoryTree(await getCategoryTree()); this.selectedId=this.navigation.some((item)=>item.id===this.pendingCategoryId)?this.pendingCategoryId:this.navigation[0]?.id||0; if(this.selectedId) await this.loadProducts() }catch(error){ uni.showToast({title:error.message,icon:'none'}) }finally{ this.loading=false } },
			async selectCategory(item){ if(item.id===this.selectedId)return; this.selectedId=item.id; await this.loadProducts() },
			async loadProducts(){ try{ this.products=normalizeProductList(await getProducts({categoryId:this.selectedId,page:1,size:8})).list }catch(error){ this.products=[]; uni.showToast({title:error.message,icon:'none'}) } },
			openProducts(categoryId=''){ uni.navigateTo({url:`/pages/products/list${categoryId?`?categoryId=${categoryId}`:''}`}) }, openDetail(product){ uni.navigateTo({url:`/pages/products/detail?id=${product.id}`}) },
		},
	}
</script>

<style scoped>
	.category-page{height:100vh;padding-top:var(--status-bar-height);overflow:hidden;background:#f5f6f8}.category-search{display:flex;height:68rpx;margin:18rpx 24rpx;padding:0 22rpx;align-items:center;gap:12rpx;border-radius:10rpx;color:#9ca3ad;background:#fff;font-size:24rpx}.category-search>image{width:32rpx;height:32rpx}.category-layout{display:flex;height:calc(100vh - var(--status-bar-height) - 104rpx)}.category-nav{width:190rpx;height:100%;flex:0 0 190rpx;background:#f0f1f3}.nav-item{display:flex;min-height:92rpx;padding:18rpx 14rpx;box-sizing:border-box;align-items:center;justify-content:center;color:#606773;font-size:24rpx;text-align:center}.nav-item.child{min-height:76rpx;color:#818894;font-size:21rpx}.nav-item.active{position:relative;color:#e1251b;background:#fff;font-weight:700}.nav-item.active::before{position:absolute;top:24rpx;bottom:24rpx;left:0;width:6rpx;background:#e1251b;content:''}.category-content{min-width:0;height:100%;flex:1;background:#fff}.category-heading{padding:30rpx 26rpx 24rpx;border-bottom:1rpx solid #eef0f2}.kicker,.title{display:block}.kicker{color:#e1251b;font-size:18rpx;font-weight:800}.title{margin-top:8rpx;color:#292d33;font-size:36rpx;font-weight:800}.subsection{padding:26rpx}.subsection-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:24rpx;color:#2f343b;font-size:28rpx;font-weight:700}.subsection-head text:last-child{color:#9aa1aa;font-size:21rpx;font-weight:400}.children-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24rpx 12rpx}.child-item{display:flex;min-width:0;flex-direction:column;align-items:center;color:#626a75;font-size:21rpx;text-align:center}.child-item>text{width:100%;margin-top:10rpx;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.child-icon{display:flex;width:92rpx;height:92rpx;align-items:center;justify-content:center;border-radius:14rpx;color:#4b525c;font-size:30rpx;font-weight:700}.child-icon image{width:58rpx;height:58rpx}.tone-0{background:#fff0e5}.tone-1{background:#e8f5eb}.tone-2{background:#e6f1fd}.tone-3{background:#f4eafd}.products-block{border-top:16rpx solid #f5f6f8}.product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx}.category-loading{display:flex;height:70vh;align-items:center;justify-content:center;color:#9299a3;font-size:25rpx}
</style>
