<template>
	<view class="address-page">
		<view class="page-head"><view><text class="kicker">DELIVERY</text><text class="title">收货地址</text></view><button @tap="openForm()">新增地址</button></view>
		<view v-if="addresses.length" class="address-list">
			<view v-for="item in addresses" :key="item.id" class="address-card">
				<view class="contact"><text>{{ item.receiverName }}</text><text>{{ item.receiverPhone }}</text><text v-if="item.isDefault" class="default-tag">默认</text></view>
				<text class="full-address">{{ item.fullAddress }}</text>
				<view class="address-actions"><text v-if="!item.isDefault" @tap="makeDefault(item)">设为默认</text><view><text @tap="openForm(item)">编辑</text><text @tap="remove(item)">删除</text></view></view>
			</view>
		</view>
		<StateView v-else-if="!loading" title="还没有收货地址" description="新增地址后即可用于订单配送" action-text="新增地址" @action="openForm()" />
		<view v-else class="loading">正在加载地址...</view>

		<view v-if="formVisible" class="form-mask" @tap="closeForm"><view class="form-sheet" @tap.stop>
			<view class="sheet-head"><text>{{ form.id?'编辑地址':'新增地址' }}</text><image src="/static/icons/close.png" mode="aspectFit" @tap="closeForm" /></view>
			<view class="field"><text>收货人</text><input v-model.trim="form.receiverName" maxlength="30" placeholder="请输入姓名" /></view>
			<view class="field"><text>手机号</text><input v-model.trim="form.receiverPhone" type="number" maxlength="11" placeholder="请输入 11 位手机号" /></view>
			<picker mode="region" :value="form.region" @change="regionChange"><view class="field"><text>所在地区</text><text class="field-value" :class="{placeholder:!form.region.length}">{{ form.region.length?form.region.join(' '):'请选择省 / 市 / 区' }}</text><image class="field-arrow" src="/static/icons/chevron-right.png" mode="aspectFit" /></view></picker>
			<view class="field textarea-field"><text>详细地址</text><textarea v-model.trim="form.detailAddress" maxlength="120" placeholder="街道、楼牌号等" /></view>
			<view class="default-row" @tap="form.isDefault=!form.isDefault"><view class="check" :class="{checked:form.isDefault}">{{ form.isDefault?'✓':'' }}</view><text>设为默认收货地址</text></view>
			<button class="save" :loading="saving" :disabled="saving" @tap="save">保存地址</button>
		</view></view>
	</view>
</template>

<script>
	import StateView from '../../components/StateView.vue'
	import {addAddress,deleteAddress,getAddressList,setDefaultAddress,updateAddress} from '../../api/index.js'
	import {normalizeAddressList} from '../../utils/normalizers.js'
	const emptyForm=()=>({id:null,receiverName:'',receiverPhone:'',region:[],detailAddress:'',isDefault:false})
	export default{
		components:{StateView},data(){return{loading:true,saving:false,addresses:[],formVisible:false,form:emptyForm()}},onShow(){this.loadAddresses()},
		methods:{async loadAddresses(){this.loading=true;try{this.addresses=normalizeAddressList(await getAddressList())}catch(error){uni.showToast({title:error.message,icon:'none'})}finally{this.loading=false}},openForm(item){this.form=item?{...item,region:[item.province,item.city,item.district].filter(Boolean),isDefault:item.isDefault}:emptyForm();this.formVisible=true},closeForm(){if(!this.saving)this.formVisible=false},regionChange(event){this.form.region=event.detail.value},validate(){if(!this.form.receiverName)return'请输入收货人姓名';if(!/^1[3-9]\d{9}$/.test(this.form.receiverPhone))return'请输入有效手机号';if(this.form.region.length!==3)return'请选择所在地区';if(!this.form.detailAddress)return'请输入详细地址';return''},async save(){const message=this.validate();if(message){uni.showToast({title:message,icon:'none'});return}this.saving=true;const payload={id:this.form.id||undefined,receiverName:this.form.receiverName,receiverPhone:this.form.receiverPhone,province:this.form.region[0],city:this.form.region[1],district:this.form.region[2],detailAddress:this.form.detailAddress,isDefault:this.form.isDefault?1:0};try{this.form.id?await updateAddress(payload):await addAddress(payload);this.formVisible=false;uni.showToast({title:'地址已保存',icon:'success'});await this.loadAddresses()}catch(error){uni.showToast({title:error.message,icon:'none'})}finally{this.saving=false}},async makeDefault(item){try{await setDefaultAddress(item.id);await this.loadAddresses();uni.showToast({title:'已设为默认',icon:'success'})}catch(error){uni.showToast({title:error.message,icon:'none'})}},remove(item){uni.showModal({title:'删除地址',content:'确定删除这个收货地址吗？',confirmColor:'#e1251b',success:async(result)=>{if(!result.confirm)return;try{await deleteAddress(item.id);this.addresses=this.addresses.filter((entry)=>entry.id!==item.id);uni.showToast({title:'已删除',icon:'success'})}catch(error){uni.showToast({title:error.message,icon:'none'})}}})}},
	}
</script>

<style scoped>
	.address-page{min-height:100vh;padding-bottom:36rpx;background:#f5f6f8}.page-head{display:flex;padding:34rpx 28rpx 26rpx;align-items:flex-end;justify-content:space-between;background:#fff}.kicker,.title{display:block}.kicker{color:#e1251b;font-size:18rpx;font-weight:800}.title{margin-top:7rpx;color:#22272e;font-size:40rpx;font-weight:800}.page-head button{height:62rpx;margin:0;padding:0 24rpx;border:0;border-radius:8rpx;color:#fff;background:#e1251b;font-size:22rpx;line-height:62rpx}.page-head button::after{border:0}.address-list{padding:18rpx 22rpx}.address-card{margin-bottom:16rpx;padding:25rpx 24rpx;border:1rpx solid #eceef1;border-radius:11rpx;background:#fff}.contact{display:flex;align-items:center;gap:16rpx;color:#2f353c;font-size:27rpx;font-weight:700}.contact text:nth-child(2){color:#6b737e;font-size:23rpx;font-weight:400}.default-tag{padding:4rpx 9rpx;border-radius:5rpx;color:#e1251b!important;background:#fff0ee;font-size:18rpx!important}.full-address{display:block;margin-top:16rpx;color:#646c77;font-size:24rpx;line-height:1.55}.address-actions{display:flex;margin-top:22rpx;padding-top:18rpx;align-items:center;justify-content:space-between;border-top:1rpx solid #eef0f2;color:#9299a3;font-size:22rpx}.address-actions view{display:flex;gap:28rpx}.form-mask{position:fixed;inset:0;z-index:30;background:rgba(0,0,0,.46)}.form-sheet{position:absolute;right:0;bottom:0;left:0;padding:0 30rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:18rpx 18rpx 0 0;background:#fff}.sheet-head{display:flex;height:96rpx;align-items:center;justify-content:space-between;border-bottom:1rpx solid #eceef1;color:#272c33;font-size:30rpx;font-weight:700}.sheet-head image{width:48rpx;height:48rpx;padding:9rpx}.field{display:flex;min-height:88rpx;align-items:center;border-bottom:1rpx solid #eef0f2;color:#454c55;font-size:24rpx}.field>text:first-child{width:150rpx;flex:0 0 150rpx}.field input,.field-value{min-width:0;flex:1;font-size:25rpx}.field-value.placeholder{color:#a8adb5}.field-arrow{width:28rpx;height:28rpx}.textarea-field{align-items:flex-start;padding:24rpx 0}.textarea-field textarea{height:110rpx;min-width:0;flex:1;font-size:25rpx}.default-row{display:flex;padding:24rpx 0;align-items:center;gap:14rpx;color:#555d67;font-size:23rpx}.check{display:flex;width:36rpx;height:36rpx;align-items:center;justify-content:center;border:2rpx solid #cfd3d8;border-radius:50%;color:#fff;font-size:20rpx}.check.checked{border-color:#e1251b;background:#e1251b}.save{height:82rpx;margin:6rpx 0 0;border:0;border-radius:9rpx;color:#fff;background:#e1251b;font-size:27rpx;line-height:82rpx}.save::after{border:0}.save[disabled]{color:#fff;opacity:.6}.loading{display:flex;height:60vh;align-items:center;justify-content:center;color:#969da6;font-size:24rpx}
</style>
