<template>
	<view class="state-view">
		<view class="state-mark"><image :src="error?'/static/icons/state-error.png':'/static/icons/state-empty.png'" mode="aspectFit" /></view>
		<text class="state-title">{{ title }}</text>
		<text v-if="description" class="state-description">{{ description }}</text>
		<button v-if="actionText" class="state-action" @tap="$emit('action')">{{ actionText }}</button>
	</view>
</template>

<script>
	export default {
		name: 'StateView',
		props: {
			title: { type: String, default: '暂无内容' },
			description: { type: String, default: '' },
			actionText: { type: String, default: '' },
			error: { type: Boolean, default: false },
		},
		emits: ['action'],
	}
</script>

<style scoped>
	.state-view { display: flex; min-height: 420rpx; padding: 56rpx 32rpx; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
	.state-mark { display: flex; width: 92rpx; height: 92rpx; align-items: center; justify-content: center; border-radius: 50%; background: #fff0ee; }
	.state-mark image { width: 48rpx; height: 48rpx; }
	.state-title { margin-top: 28rpx; color: #30343b; font-size: 30rpx; font-weight: 700; }
	.state-description { margin-top: 12rpx; color: #949ba5; font-size: 24rpx; line-height: 1.6; }
	.state-action { min-width: 190rpx; height: 70rpx; margin-top: 28rpx; border: 0; border-radius: 8rpx; color: #fff; background: #e1251b; font-size: 25rpx; line-height: 70rpx; }
	.state-action::after { border: 0; }
</style>
