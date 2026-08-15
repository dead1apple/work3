<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getUserInfo, updateUserInfo } from '../api/index.js'
import { useUserStore } from '../store/user.js'
const router = useRouter(); const store = useUserStore(); const form = ref({ nickname: '', email: '', avatar: '', gender: '', birthday: '' })
onMounted(async () => { const data = await getUserInfo(); form.value = { ...form.value, ...(data?.user || data) } })
const save = async () => { await updateUserInfo(form.value); store.setUserInfo({ ...(store.userInfo || {}), ...form.value }); ElMessage.success('资料已保存'); router.back() }
</script>
<template><section class="commerce-page narrow"><div class="page-title"><div><p>ACCOUNT</p><h1>编辑资料</h1></div></div><el-form label-position="top"><el-form-item label="昵称"><el-input v-model="form.nickname"/></el-form-item><el-form-item label="邮箱"><el-input v-model="form.email"/></el-form-item><el-form-item label="头像链接"><el-input v-model="form.avatar"/></el-form-item><el-form-item label="性别"><el-select v-model="form.gender"><el-option label="保密" value=""/><el-option label="男" value="male"/><el-option label="女" value="female"/></el-select></el-form-item><el-form-item label="生日"><el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD"/></el-form-item><el-button type="primary" size="large" @click="save">保存资料</el-button></el-form></section></template>
