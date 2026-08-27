<template>
	<view class="review-page">
		<view v-if="loading" class="page-loading">正在加载订单商品...</view>
		<StateView v-else-if="error" title="评价信息加载失败" :description="error" action-text="重新加载" error @action="loadOrder" />
		<StateView v-else-if="!order" title="评价信息加载失败" description="未找到订单信息，请返回订单列表重试" action-text="重新加载" error @action="loadOrder" />
		<StateView v-else-if="order.status!==3" title="当前订单暂不能评价" description="确认收货后即可发表商品评价" />
		<StateView v-else-if="!order.items.length" title="暂无可评价商品" description="订单中没有找到商品明细" />
		<template v-else>
			<view class="review-head">
				<text class="kicker">PRODUCT REVIEW</text>
				<view class="headline"><text>发表商品评价</text><text>{{ order.orderNo }}</text></view>
			</view>

			<view class="section product-section">
				<view class="section-head"><view><text>评价商品</text><text>{{ itemLocked ? '已选择指定商品' : '请选择本次评价的商品' }}</text></view><text>{{ order.items.length }} 件</text></view>
				<view class="product-list">
					<view v-for="item in order.items" :key="item.orderItemId" class="product-option" :class="{selected:selectedItemId===item.orderItemId,locked:itemLocked&&selectedItemId!==item.orderItemId}" @tap="selectItem(item)">
						<view class="product-image"><image v-if="item.image" :src="item.image" mode="aspectFill" /><text v-else>JD</text></view>
						<view class="product-copy"><text>{{ item.name }}</text><text v-if="item.spec">{{ item.spec }}</text><text>¥{{ formatPrice(item.price) }} · 数量 ×{{ item.quantity }}</text></view>
						<view class="select-mark">{{ selectedItemId===item.orderItemId ? '✓' : '' }}</view>
					</view>
				</view>
			</view>

			<view class="section rating-section">
				<view class="field-title"><text>总体评分</text><text>必填</text></view>
				<view class="rating-row"><view class="stars"><text v-for="value in 5" :key="value" :class="{active:value<=rating}" @tap="setRating(value)">{{ value<=rating?'★':'☆' }}</text></view><text>{{ ratingText }}</text></view>
			</view>

			<view class="section content-section">
				<view class="field-title"><text>评价内容</text><text>{{ content.length }}/500</text></view>
				<textarea v-model="content" maxlength="500" placeholder="商品质量如何？写下你的真实使用感受" />
			</view>

			<view class="section anonymous-row">
				<view><text>匿名评价</text><text>{{ anonymous ? '将隐藏昵称和头像' : '将展示公开昵称和头像' }}</text></view>
				<switch :checked="anonymous" color="#e1251b" @change="anonymous=$event.detail.value" />
			</view>

			<view class="submit-bar"><button :loading="submitting" :disabled="!canSubmit" @tap="submitReview">发布评价</button></view>
		</template>
	</view>
</template>

<script>
	import StateView from '../../components/StateView.vue'
	import {createReview,getOrderDetail} from '../../api/index.js'
	import {formatMoney} from '../../utils/format.js'
	import {normalizeOrderDetail} from '../../utils/normalizers.js'

	export default{
		components:{StateView},
		data(){return{orderNo:'',requestedItemId:0,loading:true,error:'',order:null,selectedItemId:0,rating:5,content:'',anonymous:false,submitting:false,ratingTexts:['非常差','不满意','一般','比较满意','非常满意']}},
		computed:{selectedItem(){return this.order?.items.find((item)=>item.orderItemId===this.selectedItemId)||null},itemLocked(){return this.requestedItemId>0},ratingText(){return this.ratingTexts[this.rating-1]||'请选择评分'},canSubmit(){return Boolean(this.selectedItem&&this.rating&&!this.submitting)}},
		onLoad(options){this.orderNo=String(options.orderNo||'');this.requestedItemId=Number(options.orderItemId||0);this.loadOrder()},
		methods:{
			formatPrice:formatMoney,
			async loadOrder(){if(!this.orderNo){this.loading=false;this.error='缺少订单号，请从我的订单重新进入';return}this.loading=true;this.error='';try{const order=normalizeOrderDetail(await getOrderDetail(this.orderNo));this.order=order;if(order.status===3&&order.items.length){const target=this.requestedItemId?order.items.find((item)=>Number(item.orderItemId)===this.requestedItemId):order.items[0];if(!target)throw new Error('订单中没有找到要评价的商品');this.selectedItemId=target.orderItemId}}catch(error){this.order=null;this.error=error.message||'暂时无法加载订单商品'}finally{this.loading=false}},
			selectItem(item){if(this.itemLocked)return;this.selectedItemId=item.orderItemId},setRating(value){this.rating=value},
			async submitReview(){if(!this.canSubmit)return;const content=this.content.trim();this.submitting=true;try{await createReview({orderItemId:Number(this.selectedItemId),rating:this.rating,content,isAnonymous:this.anonymous?1:0});uni.showToast({title:'评价发布成功',icon:'success'});setTimeout(()=>{if(getCurrentPages().length>1)uni.navigateBack();else uni.redirectTo({url:'/pages/orders/list?status=3'})},600)}catch(error){uni.showToast({title:error.message||'评价发布失败',icon:'none'})}finally{this.submitting=false}},
		},
	}
</script>

<style scoped>
	.review-page{min-height:100vh;padding-bottom:142rpx;background:#f5f6f8}.page-loading{display:flex;height:70vh;align-items:center;justify-content:center;color:#9299a3;font-size:24rpx}.review-head{padding:34rpx 28rpx 28rpx;border-bottom:1rpx solid #eceef1;background:#fff}.kicker{display:block;color:#e1251b;font-size:18rpx;font-weight:800}.headline{display:flex;margin-top:8rpx;align-items:flex-end;justify-content:space-between;gap:20rpx}.headline text:first-child{color:#252a31;font-size:40rpx;font-weight:800}.headline text:last-child{max-width:52%;overflow:hidden;color:#969da6;font-size:20rpx;text-overflow:ellipsis;white-space:nowrap}.section{margin-top:16rpx;padding:28rpx;background:#fff}.section-head,.field-title{display:flex;align-items:flex-start;justify-content:space-between}.section-head>view>text{display:block}.section-head>view>text:first-child,.field-title>text:first-child{color:#30363e;font-size:29rpx;font-weight:700}.section-head>view>text:last-child{margin-top:7rpx;color:#999fa8;font-size:21rpx}.section-head>text,.field-title>text:last-child{color:#9ba1aa;font-size:21rpx}.product-list{margin-top:24rpx}.product-option{position:relative;display:flex;min-height:142rpx;margin-top:14rpx;padding:18rpx;align-items:center;border:1rpx solid #e1e4e8;border-radius:8rpx;background:#fff}.product-option:first-child{margin-top:0}.product-option.selected{border:2rpx solid #e1251b;padding:17rpx;background:#fffafa}.product-option.locked{opacity:.5}.product-image{display:flex;width:104rpx;height:104rpx;flex:0 0 104rpx;align-items:center;justify-content:center;overflow:hidden;border-radius:6rpx;color:#fff;background:#d9dde2;font-size:22rpx;font-weight:800}.product-image image{width:100%;height:100%}.product-copy{min-width:0;flex:1;margin-left:18rpx}.product-copy text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.product-copy text:first-child{color:#343a42;font-size:25rpx;font-weight:700}.product-copy text:nth-child(2),.product-copy text:last-child{margin-top:9rpx;color:#9299a3;font-size:21rpx;font-weight:400}.select-mark{display:flex;width:36rpx;height:36rpx;flex:0 0 36rpx;align-items:center;justify-content:center;border:2rpx solid #d4d8dd;border-radius:50%;color:#fff;font-size:20rpx}.product-option.selected .select-mark{border-color:#e1251b;background:#e1251b}.rating-row{display:flex;margin-top:24rpx;align-items:center;justify-content:space-between}.stars{display:flex;height:64rpx;align-items:center;gap:12rpx}.stars text{color:#d8dce1;font-size:52rpx;line-height:64rpx}.stars text.active{color:#f2a51a}.rating-row>text{color:#e1251b;font-size:23rpx;font-weight:700}.content-section textarea{width:100%;height:230rpx;margin-top:22rpx;padding:20rpx;border:1rpx solid #e2e5e8;border-radius:8rpx;color:#424952;background:#fafbfc;font-size:25rpx;line-height:1.65}.anonymous-row{display:flex;align-items:center;justify-content:space-between}.anonymous-row>view>text{display:block}.anonymous-row>view>text:first-child{color:#343a42;font-size:27rpx;font-weight:700}.anonymous-row>view>text:last-child{margin-top:7rpx;color:#969da6;font-size:21rpx}.anonymous-row switch{transform:scale(.82);transform-origin:right center}.submit-bar{position:fixed;right:0;bottom:0;left:0;z-index:20;padding:14rpx 24rpx calc(14rpx + env(safe-area-inset-bottom));border-top:1rpx solid #e2e5e8;background:#fff}.submit-bar button{height:82rpx;margin:0;border:0;border-radius:8rpx;color:#fff;background:#e1251b;font-size:27rpx;font-weight:700;line-height:82rpx}.submit-bar button::after{border:0}.submit-bar button[disabled]{color:#fff;opacity:.5}
</style>
