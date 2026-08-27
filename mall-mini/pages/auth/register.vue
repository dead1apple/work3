<template>
	<view class="auth-page">
		<view class="brand"><view class="brand-mark">JD</view><text>京东商城</text></view>
		<view class="auth-copy"><text class="kicker">CREATE ACCOUNT</text><text class="title">注册账号</text><text class="subtitle">创建账号后即可收藏商品、下单和管理优惠券</text></view>
		<view class="form-panel">
			<text class="field-label">用户名</text><view class="field"><input v-model.trim="form.username" maxlength="40" placeholder="设置登录用户名" /></view>
			<text class="field-label">密码</text><view class="field"><input v-model="form.password" :password="!showPassword" maxlength="40" placeholder="不少于 6 位" /><text class="password-toggle" @tap="showPassword=!showPassword">{{ showPassword?'隐藏':'显示' }}</text></view>
			<text class="field-label">手机号</text><view class="field"><input v-model.trim="form.phone" type="number" maxlength="11" placeholder="请输入 11 位手机号" /></view>
			<text class="field-label">短信验证码</text><view class="code-row"><view class="field"><input v-model.trim="form.code" type="number" maxlength="8" placeholder="请输入验证码" /></view><button :loading="codeSending" :disabled="codeSending||countdown>0" @tap="requestCode">{{ countdown>0?`${countdown}s`:'获取验证码' }}</button></view>
			<view v-if="codeSent" class="mock-row"><text>开发环境联调</text><text @tap="fillMockCode">获取测试验证码</text></view>
			<text class="field-label">昵称</text><view class="field"><input v-model.trim="form.nickname" maxlength="20" placeholder="选填，默认与用户名一致" /></view>
			<text class="field-label">邮箱</text><view class="field"><input v-model.trim="form.email" maxlength="80" placeholder="选填" /></view>
			<button class="submit" :loading="loading" :disabled="loading" @tap="submit">注册</button>
			<view class="switch-row"><text>已有账号？</text><text @tap="backToLogin">返回登录</text></view>
		</view>
	</view>
</template>

<script>
	import { getMockCode, register, sendCode } from '../../api/index.js'
	export default {
		data(){return{form:{username:'',password:'',phone:'',code:'',nickname:'',email:''},showPassword:false,loading:false,codeSending:false,codeSent:false,countdown:0,timer:null}},
		onUnload(){this.clearTimer()},
		methods:{
			validPhone(){return /^1[3-9]\d{9}$/.test(this.form.phone)},
			clearTimer(){if(this.timer){clearInterval(this.timer);this.timer=null}},
			startCountdown(){this.clearTimer();this.countdown=60;this.timer=setInterval(()=>{this.countdown-=1;if(this.countdown<=0)this.clearTimer()},1000)},
			async requestCode(){if(!this.validPhone()){uni.showToast({title:'请输入有效手机号',icon:'none'});return}this.codeSending=true;try{const result=await sendCode({phone:this.form.phone});this.codeSent=true;this.startCountdown();const code=result?.code||result?.smsCode;if(code)this.form.code=String(code);uni.showToast({title:'验证码已发送',icon:'success'})}catch(error){uni.showToast({title:error.message||'验证码发送失败',icon:'none'})}finally{this.codeSending=false}},
			async fillMockCode(){if(!this.validPhone())return;try{const result=await getMockCode(this.form.phone);const code=result?.code||result?.smsCode||result?.value||(typeof result==='string'||typeof result==='number'?result:'');if(!code)throw new Error('当前环境未返回测试验证码');this.form.code=String(code);uni.showToast({title:'验证码已填入',icon:'success'})}catch(error){uni.showToast({title:error.message||'测试验证码获取失败',icon:'none'})}},
			validate(){if(!this.form.username)return'请输入用户名';if(this.form.password.length<6)return'密码不少于 6 位';if(!this.validPhone())return'请输入有效手机号';if(!this.form.code)return'请输入短信验证码';if(this.form.nickname&&this.form.nickname.length<2)return'昵称不少于 2 个字符';if(this.form.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))return'请输入有效邮箱';return''},
			async submit(){const message=this.validate();if(message){uni.showToast({title:message,icon:'none'});return}if(this.loading)return;this.loading=true;try{await register({...this.form,nickname:this.form.nickname||undefined,email:this.form.email||undefined});uni.showToast({title:'注册成功',icon:'success'});setTimeout(()=>uni.redirectTo({url:`/pages/auth/login?username=${encodeURIComponent(this.form.username)}&registered=1`}),500)}catch(error){uni.showToast({title:error.message||'注册失败',icon:'none'})}finally{this.loading=false}},
			backToLogin(){if(getCurrentPages().length>1)uni.navigateBack();else uni.redirectTo({url:'/pages/auth/login'})},
		},
	}
</script>

<style scoped>
	.auth-page{min-height:100vh;padding:36rpx 36rpx 64rpx;box-sizing:border-box;background:#f6f7f9}.brand{display:flex;align-items:center;gap:14rpx;color:#20242b;font-size:29rpx;font-weight:800}.brand-mark{display:flex;width:60rpx;height:60rpx;align-items:center;justify-content:center;border-radius:10rpx;color:#fff;background:#e1251b;font-size:21rpx}.auth-copy{display:flex;margin:42rpx 6rpx 28rpx;flex-direction:column}.kicker{color:#e1251b;font-size:18rpx;font-weight:800}.title{margin-top:8rpx;color:#1d2127;font-size:46rpx;font-weight:800}.subtitle{margin-top:12rpx;color:#8c949f;font-size:23rpx;line-height:1.5}.form-panel{padding:32rpx 28rpx;border:1rpx solid #eceef1;border-radius:14rpx;background:#fff;box-shadow:0 14rpx 42rpx rgba(40,43,48,.06)}.field-label{display:block;margin:21rpx 0 10rpx;color:#424952;font-size:23rpx;font-weight:700}.field-label:first-child{margin-top:0}.field{display:flex;height:76rpx;min-width:0;flex:1;padding:0 20rpx;align-items:center;border:1rpx solid #dfe2e6;border-radius:8rpx;background:#fafbfc}.field input{min-width:0;flex:1;font-size:25rpx}.password-toggle{padding:16rpx 0 16rpx 16rpx;color:#e1251b;font-size:21rpx}.code-row{display:flex;gap:12rpx}.code-row button{width:184rpx;height:76rpx;margin:0;padding:0;border:1rpx solid #e1251b;border-radius:8rpx;color:#e1251b;background:#fff;font-size:22rpx;line-height:76rpx}.code-row button[disabled]{color:#a9adb3;border-color:#dfe2e6}.mock-row,.switch-row{display:flex;margin-top:14rpx;align-items:center;justify-content:space-between;color:#a0a6ae;font-size:20rpx}.mock-row text:last-child,.switch-row text:last-child{color:#e1251b}.submit{height:80rpx;margin-top:32rpx;border:0;border-radius:8rpx;color:#fff;background:#e1251b;font-size:27rpx;font-weight:700;line-height:80rpx}.submit[disabled]{color:#fff;opacity:.6}.switch-row{justify-content:center;gap:10rpx;margin-top:24rpx;font-size:22rpx}
</style>
