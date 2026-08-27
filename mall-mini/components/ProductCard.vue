<template>
	<view class="product-card" @tap="$emit('select', product)">
		<view class="image-wrap">
			<image v-if="product.image" class="product-image" :src="product.image" mode="aspectFill" lazy-load />
			<view v-else class="image-placeholder"><text>JD</text></view>
			<text v-if="product.stock === 0" class="stock-tag">暂时缺货</text>
		</view>
		<view class="product-copy">
			<text class="product-name">{{ product.title }}</text>
			<text v-if="product.subtitle" class="product-subtitle">{{ product.subtitle }}</text>
			<view class="product-meta">
				<view class="price"><text class="currency">¥</text><text>{{ formatPrice(product.price) }}</text></view>
				<text v-if="product.sales" class="sales">已售 {{ product.sales }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { formatMoney } from '../utils/format.js'

	export default {
		name: 'ProductCard',
		props: {
			product: { type: Object, required: true },
		},
		emits: ['select'],
		methods: { formatPrice: formatMoney },
	}
</script>

<style scoped>
	.product-card { overflow: hidden; border: 1rpx solid #edf0f3; border-radius: 14rpx; background: #fff; }
	.image-wrap { position: relative; width: 100%; height: 330rpx; overflow: hidden; background: #f3f4f6; }
	.product-image, .image-placeholder { width: 100%; height: 100%; }
	.image-placeholder { display: flex; align-items: center; justify-content: center; color: #fff; background: #d9dde3; font-size: 34rpx; font-weight: 800; }
	.stock-tag { position: absolute; top: 12rpx; left: 12rpx; padding: 5rpx 10rpx; border-radius: 6rpx; color: #6b7280; background: rgba(255,255,255,.92); font-size: 20rpx; }
	.product-copy { padding: 18rpx 16rpx 16rpx; }
	.product-name { display: -webkit-box; min-height: 72rpx; overflow: hidden; color: #24272d; font-size: 27rpx; line-height: 36rpx; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
	.product-subtitle { display: block; margin-top: 8rpx; overflow: hidden; color: #9097a3; font-size: 22rpx; text-overflow: ellipsis; white-space: nowrap; }
	.product-meta { display: flex; align-items: flex-end; justify-content: space-between; gap: 8rpx; margin-top: 14rpx; }
	.price { color: #e1251b; font-size: 34rpx; font-weight: 800; }
	.currency { margin-right: 2rpx; font-size: 21rpx; }
	.sales { color: #a1a7b0; font-size: 21rpx; white-space: nowrap; }
</style>
