<template>
	<view class="profile-page">
		<view class="profile-header" @tap="loggedIn?openProfileEdit():goLogin()">
			<view class="avatar"><image v-if="user?.avatar" :src="user.avatar" mode="aspectFill" /><text v-else>{{ loggedIn?(user?.nickname||'用').slice(0,1):'JD' }}</text></view>
			<view class="profile-copy" @tap="!loggedIn&&goLogin()"><text class="name">{{ loggedIn?(user?.nickname||user?.username||'商城用户'):'登录 / 注册' }}</text><text class="member">{{ loggedIn?'京东会员 · 欢迎回来':'登录后同步订单与收藏' }}</text></view>
			<image class="header-arrow" src="/static/icons/chevron-right-white.png" mode="aspectFit" />
		</view>
		<view class="order-panel"><view class="panel-head" @tap="openOrders()"><text>我的订单</text><view><text>查看全部</text><image src="/static/icons/chevron-right.png" mode="aspectFit" /></view></view><view class="order-grid"><view v-for="item in orderShortcuts" :key="item.status" class="order-item" @tap="openOrders(item.status)"><image class="order-icon" :src="item.icon" mode="aspectFit" /><text>{{ item.label }}</text></view></view></view>
		<view class="menu-list"><view v-for="item in menus" :key="item.url" class="menu-item" @tap="openMenu(item)"><view class="menu-leading"><view class="menu-icon"><image :src="item.icon" mode="aspectFit" /></view><text>{{ item.label }}</text></view><image class="menu-arrow" src="/static/icons/chevron-right.png" mode="aspectFit" /></view></view>
		<button v-if="loggedIn" class="logout" @tap="handleLogout"><image src="/static/icons/logout.png" mode="aspectFit" /><text>退出登录</text></button>
	</view>
</template>

<script>
	import { getUserInfo, logout } from '../../api/index.js'
	import { clearSession, getStoredUser, isLoggedIn, saveStoredUser } from '../../utils/auth.js'
	import { normalizeUser } from '../../utils/normalizers.js'

	export default {
		data() {
			return {
				loggedIn: false,
				user: null,
				orderShortcuts: [
					{ label: '待付款', status: 0, icon: '/static/icons/order-payment.png' },
					{ label: '待发货', status: 1, icon: '/static/icons/order-shipping.png' },
					{ label: '待收货', status: 2, icon: '/static/icons/order-receive.png' },
					{ label: '已完成', status: 3, icon: '/static/icons/order-complete.png' },
				],
				menus: [
					{ label: '个人资料', url: '/pages/profile/edit', icon: '/static/icons/order-complete.png' },
					{ label: '我的优惠券', url: '/pages/coupons/index?tab=mine', icon: '/static/icons/order-payment.png' },
					{ label: '我的收藏', url: '/pages/favorites/index', icon: '/static/icons/heart-red.png' },
					{ label: '收货地址', url: '/pages/address/index', icon: '/static/icons/map-pin.png' },
					{ label: '品牌馆', url: '/pages/brands/index', icon: '/static/icons/category.png' },
					{ label: '购物车', url: '/pages/cart/index', tab: true, icon: '/static/icons/cart-red.png' },
					{ label: '商品分类', url: '/pages/category/index', tab: true, icon: '/static/icons/category.png' },
				],
			}
		},
		onShow() {
			this.loggedIn = isLoggedIn()
			this.user = getStoredUser()
			if (this.loggedIn) this.loadUser()
		},
		methods: {
			async loadUser() {
				try {
					this.user = normalizeUser(await getUserInfo())
					saveStoredUser(this.user)
				} catch (error) {
					uni.showToast({ title: error.message, icon: 'none' })
				}
			},
			goLogin() {
				uni.navigateTo({ url: '/pages/auth/login' })
			},
			openProfileEdit() {
				uni.navigateTo({ url: '/pages/profile/edit' })
			},
			openOrders(status = '') {
				if (!this.loggedIn) {
					this.goLogin()
					return
				}
				const query = status !== '' ? `?status=${status}` : ''
				uni.navigateTo({ url: `/pages/orders/list${query}` })
			},
			openMenu(item) {
				const requiresLogin = item.url.includes('favorites') || item.url.includes('address') || item.url.includes('profile/edit') || item.url.includes('coupons')
				if (requiresLogin && !this.loggedIn) {
					this.goLogin()
					return
				}
				if (item.tab) uni.switchTab({ url: item.url })
				else uni.navigateTo({ url: item.url })
			},
			handleLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确定退出当前账号吗？',
					confirmColor: '#e1251b',
					success: async (result) => {
						if (!result.confirm) return
						try { await logout() } catch {}
						clearSession()
						this.loggedIn = false
						this.user = null
						uni.showToast({ title: '已退出', icon: 'success' })
					},
				})
			},
		},
	}
</script>

<style scoped>
	.profile-page{min-height:100vh;padding-bottom:44rpx;background:#f5f6f8}.profile-header{display:flex;min-height:250rpx;padding:calc(var(--status-bar-height) + 34rpx) 34rpx 34rpx;box-sizing:border-box;align-items:center;color:#fff;background:#c91f17}.avatar{display:flex;width:112rpx;height:112rpx;flex:0 0 112rpx;align-items:center;justify-content:center;overflow:hidden;border:5rpx solid rgba(255,255,255,.35);border-radius:50%;color:#e1251b;background:#fff;font-size:32rpx;font-weight:800}.avatar image{width:100%;height:100%}.profile-copy{min-width:0;flex:1;margin-left:24rpx}.name,.member{display:block}.name{font-size:37rpx;font-weight:800}.member{margin-top:12rpx;color:rgba(255,255,255,.78);font-size:22rpx}.header-arrow{width:34rpx;height:34rpx;opacity:.8}.order-panel,.menu-list{margin:18rpx 22rpx 0;border:1rpx solid #eceef1;border-radius:12rpx;background:#fff}.panel-head{display:flex;padding:24rpx 26rpx;align-items:center;justify-content:space-between;border-bottom:1rpx solid #eef0f2;color:#333940;font-size:28rpx;font-weight:700}.panel-head>view{display:flex;align-items:center;gap:4rpx}.panel-head>view text{color:#969da6;font-size:21rpx;font-weight:400}.panel-head image{width:24rpx;height:24rpx}.order-grid{display:grid;grid-template-columns:repeat(4,1fr);padding:24rpx 10rpx}.order-item{display:flex;flex-direction:column;align-items:center;color:#59616c;font-size:22rpx}.order-icon{width:52rpx;height:52rpx;margin-bottom:10rpx}.menu-list{padding:0 24rpx}.menu-item{display:flex;height:96rpx;align-items:center;justify-content:space-between;border-bottom:1rpx solid #eef0f2}.menu-item:last-child{border-bottom:0}.menu-leading{display:flex;align-items:center;gap:20rpx;color:#3d444d;font-size:26rpx}.menu-icon{display:flex;width:48rpx;height:48rpx;align-items:center;justify-content:center;border-radius:10rpx;background:#fff0ee}.menu-icon image{width:29rpx;height:29rpx}.menu-arrow{width:28rpx;height:28rpx}.logout{display:flex;height:80rpx;margin:28rpx 22rpx 0;align-items:center;justify-content:center;gap:12rpx;border:1rpx solid #e4e6e9;border-radius:9rpx;color:#e1251b;background:#fff;font-size:26rpx;line-height:80rpx}.logout image{width:30rpx;height:30rpx}.logout::after{border:0}
</style>
