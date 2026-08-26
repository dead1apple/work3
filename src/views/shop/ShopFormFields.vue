<script setup>
import { ElInput } from 'element-plus'
import ProductImageUpload from '../products/ProductImageUpload.vue'
defineProps({ modelValue: { type: Object, required: true } })
</script>

<template>
  <div class="form-fields">
    <label class="field field-span-2"><span>店铺名称 <b>必填</b></span><el-input v-model="modelValue.shopName" aria-label="店铺名称" maxlength="100" show-word-limit /></label>
    <label class="field"><span>店铺 Logo</span><ProductImageUpload v-model="modelValue.logo" label="上传店铺 Logo" /></label>
    <label class="field"><span>营业执照</span><ProductImageUpload v-model="modelValue.licenseImage" label="上传营业执照" /></label>
    <label class="field field-span-2"><span>店铺简介</span><el-input v-model="modelValue.description" data-testid="shop-description" aria-label="店铺简介" type="textarea" :rows="4" /></label>
    <label class="field"><span>店铺地址</span><el-input v-model="modelValue.address" aria-label="店铺地址" /></label>
    <label class="field"><span>经纬度</span><el-input v-model="modelValue.location" aria-label="店铺经纬度" placeholder="例如：116.397428,39.90923" /></label>
  </div>
</template>

<style scoped>
.form-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-5)}.field{display:grid;gap:var(--space-2)}.field-span-2{grid-column:1/-1}.field span{font-size:13px;font-weight:650}.field b{margin-left:4px;color:var(--color-accent-strong);font-size:10px}@media(max-width:760px){.form-fields{grid-template-columns:1fr}.field-span-2{grid-column:1}}
</style>
