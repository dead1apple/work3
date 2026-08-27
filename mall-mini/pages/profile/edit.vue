<template>
	<view class="edit-page">
		<view v-if="loading" class="loading">正在加载个人资料...</view>
		<template v-else>
			<view class="profile-preview">
				<view class="avatar"><image v-if="avatarVisible" :src="form.avatar" mode="aspectFill" @error="avatarError=true" /><text v-else>{{ avatarText }}</text></view>
				<text>{{ form.nickname||form.username||'商城用户' }}</text><text>资料会同步到订单与评价展示</text>
			</view>
			<view class="form-panel">
				<view class="account-row"><view><text>登录账号</text><text>{{ form.username||'--' }}</text></view><view><text>绑定手机号</text><text>{{ form.phone||'--' }}</text></view></view>
				<text class="field-label">昵称</text><view class="field"><input v-model.trim="form.nickname" maxlength="20" placeholder="请输入 2-20 个字符" /></view>
				<text class="field-label">邮箱</text><view class="field"><input v-model.trim="form.email" maxlength="80" placeholder="例如 jd@example.com" /></view>
				<text class="field-label">头像地址</text><view class="field"><input v-model.trim="form.avatar" maxlength="300" placeholder="请输入 http(s) 或站内图片地址" @input="avatarError=false" /></view>
				<text class="field-label">性别</text><view class="gender-control"><view v-for="item in genders" :key="item.value" :class="{active:form.gender===item.value}" @tap="form.gender=item.value">{{ item.label }}</view></view>
				<text class="field-label">生日</text><picker mode="date" :value="form.birthday" start="1900-01-01" :end="today" @change="form.birthday=$event.detail.value"><view class="date-field" :class="{placeholder:!form.birthday}"><text>{{ form.birthday||'请选择生日' }}</text><image src="/static/icons/chevron-right.png" mode="aspectFit" /></view></picker>
				<button class="save" :loading="saving" :disabled="saving" @tap="save">保存资料</button>
			</view>
		</template>
	</view>
</template>

<script>
	import { getUserInfo, updateUserInfo } from '../../api/index.js'
	import { saveStoredUser } from '../../utils/auth.js'
	import { normalizeUser } from '../../utils/normalizers.js'
	export default{
		data(){return{loading:true,saving:false,avatarError:false,today:new Date().toISOString().slice(0,10),form:{username:'',phone:'',nickname:'',email:'',avatar:'',gender:0,birthday:''},genders:[{label:'保密',value:0},{label:'男',value:1},{label:'女',value:2}]}},
		computed:{avatarText(){return(this.form.nickname||this.form.username||'用').slice(0,1).toUpperCase()},avatarVisible(){return Boolean(this.form.avatar)&&!this.avatarError}},
		onLoad(){this.loadProfile()},
		methods:{
			async loadProfile(){this.loading=true;try{this.form={...this.form,...normalizeUser(await getUserInfo())}}catch(error){uni.showToast({title:error.message||'资料加载失败',icon:'none'})}finally{this.loading=false}},
			validate(){if(this.form.nickname.length<2||this.form.nickname.length>20)return'昵称长度为 2-20 个字符';if(this.form.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))return'请输入有效邮箱';if(this.form.avatar&&!/^(https?:\/\/|\/)/i.test(this.form.avatar))return'头像地址格式不正确';return''},
			async save(){const message=this.validate();if(message){uni.showToast({title:message,icon:'none'});return}if(this.saving)return;this.saving=true;try{await updateUserInfo({nickname:this.form.nickname,email:this.form.email,avatar:this.form.avatar,gender:this.form.gender,birthday:this.form.birthday||undefined});const user=normalizeUser(await getUserInfo());saveStoredUser(user);uni.showToast({title:'资料已保存',icon:'success'});setTimeout(()=>uni.navigateBack(),500)}catch(error){uni.showToast({title:error.message||'保存失败',icon:'none'})}finally{this.saving=false}},
		},
	}
</script>

<style scoped>
	.edit-page{min-height:100vh;padding-bottom:42rpx;background:#f5f6f8}.loading{display:flex;height:70vh;align-items:center;justify-content:center;color:#969da6;font-size:24rpx}.profile-preview{display:flex;padding:38rpx 28rpx 30rpx;align-items:center;flex-direction:column;background:#fff}.avatar{display:flex;width:128rpx;height:128rpx;align-items:center;justify-content:center;overflow:hidden;border:6rpx solid #fff;border-radius:50%;color:#fff;background:#e1251b;box-shadow:0 0 0 1rpx #eceef1,0 12rpx 32rpx rgba(225,37,27,.16);font-size:40rpx;font-weight:800}.avatar image{width:100%;height:100%}.profile-preview>text:nth-child(2){margin-top:17rpx;color:#292e35;font-size:30rpx;font-weight:700}.profile-preview>text:last-child{margin-top:7rpx;color:#9aa0a9;font-size:21rpx}.form-panel{margin-top:16rpx;padding:28rpx;background:#fff}.account-row{display:grid;grid-template-columns:1fr 1fr;gap:12rpx;margin-bottom:26rpx}.account-row>view{min-width:0;padding:18rpx;border:1rpx solid #eceef1;border-radius:7rpx;background:#fafbfc}.account-row text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.account-row text:first-child{color:#9aa0a8;font-size:19rpx}.account-row text:last-child{margin-top:7rpx;color:#4b535d;font-size:22rpx}.field-label{display:block;margin:24rpx 0 10rpx;color:#444b54;font-size:23rpx;font-weight:700}.field{height:78rpx;padding:0 20rpx;border:1rpx solid #dfe2e6;border-radius:8rpx;background:#fafbfc}.field input{height:100%;font-size:24rpx}.gender-control{display:grid;grid-template-columns:repeat(3,1fr);height:72rpx;overflow:hidden;border:1rpx solid #dfe2e6;border-radius:8rpx}.gender-control view{display:flex;align-items:center;justify-content:center;border-right:1rpx solid #dfe2e6;color:#707782;font-size:23rpx}.gender-control view:last-child{border-right:0}.gender-control view.active{color:#fff;background:#e1251b}.date-field{display:flex;height:78rpx;padding:0 20rpx;align-items:center;justify-content:space-between;border:1rpx solid #dfe2e6;border-radius:8rpx;color:#424952;background:#fafbfc;font-size:24rpx}.date-field.placeholder{color:#a7adb6}.date-field image{width:28rpx;height:28rpx}.save{height:82rpx;margin-top:38rpx;border:0;border-radius:8rpx;color:#fff;background:#e1251b;font-size:27rpx;line-height:82rpx}.save[disabled]{color:#fff;opacity:.6}
</style>
