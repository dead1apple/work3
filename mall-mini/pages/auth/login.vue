<template>
	<view class="auth-page">
		<view class="brand"><view class="brand-mark">JD</view><text>京东商城</text></view>
		<view class="auth-copy"><text class="kicker">WELCOME BACK</text><text class="title">登录账号</text><text class="subtitle">登录后继续查看购物车、收藏与订单</text></view>
		<view class="form-panel">
			<text class="field-label">用户名</text><view class="field"><input v-model.trim="form.username" maxlength="40" placeholder="请输入用户名" confirm-type="next" /></view>
			<text class="field-label">密码</text><view class="field"><input v-model="form.password" :password="!showPassword" maxlength="40" placeholder="请输入密码" confirm-type="done" @confirm="submit" /><text class="password-toggle" @tap="showPassword=!showPassword">{{ showPassword?'隐藏':'显示' }}</text></view>
			<button class="submit" :loading="loading" :disabled="loading" @tap="submit">登录</button>
			<view class="register-row"><text>还没有账号？</text><text @tap="openRegister">立即注册</text></view>
		</view>
		<text class="privacy">登录即表示你已同意商城服务条款与隐私政策</text>
	</view>
</template>

<script>
	import { getUserInfo, login } from '../../api/index.js'
	import { saveSession, saveStoredUser } from '../../utils/auth.js'
	import { normalizeUser } from '../../utils/normalizers.js'
	export default {
		data(){return{form:{username:'',password:''},showPassword:false,loading:false,redirect:''}},
		onLoad(options){this.redirect=decodeURIComponent(options.redirect||'');this.form.username=decodeURIComponent(options.username||'');if(options.registered==='1')uni.showToast({title:'注册成功，请登录',icon:'none'})},
		methods:{openRegister(){uni.navigateTo({url:'/pages/auth/register'})},async submit(){if(!this.form.username){uni.showToast({title:'请输入用户名',icon:'none'});return}if(this.form.password.length<6){uni.showToast({title:'密码不少于 6 位',icon:'none'});return}this.loading=true;try{const result=await login(this.form);const token=result?.token||result?.accessToken||result;if(!token||typeof token!=='string')throw new Error('登录成功但未返回有效令牌');saveSession(token,result?.user);try{const user=normalizeUser(await getUserInfo());saveStoredUser(user)}catch{}uni.showToast({title:'登录成功',icon:'success'});setTimeout(()=>{const tabs=['/pages/index/index','/pages/category/index','/pages/cart/index','/pages/profile/index'];if(tabs.includes(this.redirect))uni.switchTab({url:this.redirect});else if(this.redirect&&this.redirect.startsWith('/'))uni.redirectTo({url:this.redirect});else uni.switchTab({url:'/pages/profile/index'})},400)}catch(error){uni.showToast({title:error.message||'登录失败',icon:'none'})}finally{this.loading=false}}},
	}
</script>

<style scoped>
	.auth-page{min-height:100vh;padding:calc(var(--status-bar-height) + 44rpx) 42rpx 60rpx;box-sizing:border-box;background:#f6f7f9}.brand{display:flex;align-items:center;gap:14rpx;color:#20242b;font-size:30rpx;font-weight:800}.brand-mark{display:flex;width:64rpx;height:64rpx;align-items:center;justify-content:center;border-radius:12rpx;color:#fff;background:#e1251b;font-size:22rpx}.auth-copy{display:flex;margin:86rpx 0 46rpx;flex-direction:column}.kicker{color:#e1251b;font-size:19rpx;font-weight:800}.title{margin-top:12rpx;color:#1d2127;font-size:52rpx;font-weight:800}.subtitle{margin-top:16rpx;color:#8c949f;font-size:25rpx}.form-panel{padding:38rpx 32rpx;border:1rpx solid #eceef1;border-radius:16rpx;background:#fff;box-shadow:0 16rpx 50rpx rgba(40,43,48,.07)}.field-label{display:block;margin:22rpx 0 12rpx;color:#424952;font-size:24rpx;font-weight:700}.field-label:first-child{margin-top:0}.field{display:flex;height:82rpx;padding:0 22rpx;align-items:center;border:1rpx solid #dfe2e6;border-radius:9rpx;background:#fafbfc}.field input{min-width:0;flex:1;font-size:26rpx}.password-toggle{padding:18rpx 0 18rpx 18rpx;color:#e1251b;font-size:22rpx}.submit{height:84rpx;margin-top:38rpx;border:0;border-radius:9rpx;color:#fff;background:#e1251b;font-size:28rpx;font-weight:700;line-height:84rpx}.submit::after{border:0}.submit[disabled]{color:#fff;opacity:.6}.register-row{display:flex;margin-top:24rpx;justify-content:center;gap:10rpx;color:#9ba1aa;font-size:22rpx}.register-row text:last-child{color:#e1251b;font-weight:700}.privacy{display:block;margin-top:30rpx;color:#a0a6ae;font-size:20rpx;text-align:center}
</style>
