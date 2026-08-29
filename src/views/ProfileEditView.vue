<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { getUserInfo, updateUserInfo, uploadImage } from '../api/index.js'
import { useUserStore } from '../store/user.js'
import { buildProfilePayload, normalizeUserProfile } from '../utils/profile.js'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(true)
const saving = ref(false)
const loadError = ref(false)
const imageError = ref(false)
const originalPayload = ref('')
const uploading = ref(false)
const fileInputRef = ref()

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const AVATAR_MAX_SIZE = 10 * 1024 * 1024

const form = reactive({
  id: null,
  username: '',
  nickname: '',
  phone: '',
  email: '',
  avatar: '',
  gender: 0,
  birthday: '',
})

const avatarText = computed(() => (form.nickname || form.username || '用户').trim().slice(0, 1).toUpperCase())
const avatarVisible = computed(() => Boolean(form.avatar) && !imageError.value)
const isDirty = computed(() => originalPayload.value && JSON.stringify(buildProfilePayload(form)) !== originalPayload.value)
const canUploadAvatar = computed(() => userStore.isMerchant)

const validateAvatar = (_rule, value, callback) => {
  if (!value || /^(https?:\/\/|\/)/i.test(value.trim())) callback()
  else callback(new Error('请输入 http(s) 开头或站内 / 开头的图片地址'))
}

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度为 2—20 个字符', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  avatar: [{ validator: validateAvatar, trigger: 'blur' }],
}

const applyProfile = (profile) => {
  Object.assign(form, profile)
  imageError.value = false
  originalPayload.value = JSON.stringify(buildProfilePayload(form))
}

const loadProfile = async () => {
  loading.value = true
  loadError.value = false
  try {
    const profile = normalizeUserProfile(await getUserInfo())
    applyProfile(profile)
    userStore.setUserInfo({ ...(userStore.userInfo || {}), ...profile })
  } catch (error) {
    if (userStore.userInfo) {
      applyProfile(normalizeUserProfile(userStore.userInfo))
      ElMessage.warning('资料同步失败，已显示本地保存的信息')
    } else {
      loadError.value = true
      ElMessage.error(error?.message || '个人资料加载失败')
    }
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  const payload = buildProfilePayload(form)
  if (JSON.stringify(payload) === originalPayload.value) {
    ElMessage.info('资料没有发生变化')
    return
  }

  saving.value = true
  try {
    await updateUserInfo(payload)
    const savedProfile = { ...normalizeUserProfile(userStore.userInfo), ...form, ...payload }
    userStore.setUserInfo(savedProfile)
    originalPayload.value = JSON.stringify(payload)
    ElMessage.success('个人资料已保存')
    await router.push('/profile')
  } catch (error) {
    ElMessage.error(error?.message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => router.push('/profile')

const triggerAvatarUpload = () => fileInputRef.value?.click()

const onAvatarFileChange = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!AVATAR_TYPES.includes(file.type)) {
    ElMessage.error('仅支持 JPEG、PNG、GIF、WebP 格式的图片')
    return
  }
  if (file.size > AVATAR_MAX_SIZE) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }

  uploading.value = true
  try {
    const payload = await uploadImage(file)
    form.avatar = payload?.url || payload?.data?.url || ''
    if (!form.avatar) throw new Error('上传接口未返回图片地址')
    imageError.value = false
    formRef.value?.clearValidate('avatar')
    ElMessage.success('头像上传成功，保存资料后生效')
  } catch (error) {
    ElMessage.error(error?.message || '头像上传失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}

onBeforeRouteLeave(async () => {
  if (!isDirty.value || saving.value) return true
  try {
    await ElMessageBox.confirm('当前修改尚未保存，确定离开吗？', '放弃修改', {
      confirmButtonText: '放弃修改',
      cancelButtonText: '继续编辑',
      type: 'warning',
      center: true,
    })
    return true
  } catch {
    return false
  }
})

onMounted(loadProfile)
</script>

<template>
  <main class="profile-edit-page">
    <section class="edit-card" aria-labelledby="edit-profile-title">
      <header class="card-header">
        <div>
          <p>账户设置</p>
          <h1 id="edit-profile-title">编辑个人资料</h1>
        </div>
        <button type="button" class="back-link" @click="cancelEdit">返回个人中心 <span aria-hidden="true">›</span></button>
      </header>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else-if="loadError" class="error-area">
        <span aria-hidden="true">!</span>
        <h2>个人资料加载失败</h2>
        <p>网络开小差了，请稍后重新加载</p>
        <el-button type="danger" @click="loadProfile">重新加载</el-button>
      </div>

      <div v-else class="edit-content">
        <aside class="avatar-panel">
          <div class="avatar-preview">
            <img v-if="avatarVisible" :src="form.avatar" alt="当前头像预览" @error="imageError = true" />
            <span v-else>{{ avatarText }}</span>
          </div>
          <h2>{{ form.nickname || '设置你的昵称' }}</h2>
          <template v-if="canUploadAvatar">
            <el-button class="upload-button" size="large" :loading="uploading" @click="triggerAvatarUpload">
              <el-icon v-if="!uploading"><Upload /></el-icon>
              {{ uploading ? '上传中…' : '上传头像' }}
            </el-button>
            <p>支持 JPEG、PNG、GIF、WebP，10MB 以内</p>
          </template>
          <p v-else>填写头像图片地址后，这里会显示预览。本地图片上传仅对商家账号开放。</p>
          <input ref="fileInputRef" class="avatar-file-input" type="file" :accept="AVATAR_TYPES.join(',')" @change="onAvatarFileChange" />
        </aside>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="profile-form" @submit.prevent="saveProfile">
          <div class="account-row">
            <div class="account-item">
              <span>登录账号</span>
              <strong>{{ form.username || '未设置' }}</strong>
            </div>
            <div class="account-item">
              <span>绑定手机号</span>
              <strong>{{ form.phone || '未绑定' }}</strong>
            </div>
          </div>

          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" size="large" maxlength="20" show-word-limit placeholder="请输入 2—20 个字符的昵称" autocomplete="nickname" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" size="large" maxlength="80" placeholder="用于接收订单和账户通知，如 jd@example.com" autocomplete="email" />
          </el-form-item>

          <el-form-item label="头像地址" prop="avatar">
            <el-input v-model="form.avatar" size="large" placeholder="请输入 http(s) 开头的图片地址" @input="imageError = false" />
          </el-form-item>

          <el-form-item label="性别">
            <el-radio-group v-model="form.gender" class="gender-group">
              <el-radio-button :value="0">保密</el-radio-button>
              <el-radio-button :value="1">男</el-radio-button>
              <el-radio-button :value="2">女</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="生日">
            <el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" format="YYYY年MM月DD日" placeholder="请选择生日" :disabled-date="(date) => date.getTime() > Date.now()" />
          </el-form-item>

          <div class="form-actions">
            <el-button size="large" :disabled="saving" @click="cancelEdit">取消</el-button>
            <el-button native-type="submit" type="danger" size="large" :loading="saving">保存资料</el-button>
          </div>
        </el-form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.profile-edit-page{min-height:calc(100vh - 136px);padding:24px 16px 48px;color:#333;background:#f5f5f5;font-family:'PingFang SC','Microsoft YaHei',Arial,sans-serif}.edit-card{width:min(100%,980px);min-height:620px;margin:0 auto;border:1px solid #eee;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.04)}.card-header{display:flex;align-items:center;justify-content:space-between;min-height:96px;padding:0 34px;border-bottom:1px solid #eee}.card-header p{margin:0 0 7px;color:#999;font-size:12px}.card-header h1{margin:0;color:#222;font-size:22px;font-weight:600}.back-link{border:0;color:#777;background:transparent;font:inherit;font-size:13px;cursor:pointer}.back-link:hover{color:#e1251b}.back-link:focus-visible{outline:2px solid #e1251b;outline-offset:4px}.back-link span{margin-left:4px;font-size:20px;vertical-align:-2px}.loading-area{padding:48px 11%}.edit-content{display:grid;grid-template-columns:260px minmax(0,1fr);gap:48px;padding:42px 56px 54px}.avatar-panel{padding:20px;text-align:center;border-right:1px solid #eee}.avatar-preview{display:grid;width:126px;height:126px;margin:0 auto 20px;overflow:hidden;place-items:center;border:5px solid #fff;border-radius:50%;color:#fff;background:linear-gradient(135deg,#e1251b,#ff6b62);box-shadow:0 0 0 1px #eee,0 10px 24px rgba(225,37,27,.15);font-size:42px;font-weight:700}.avatar-preview img{width:100%;height:100%;object-fit:cover}.avatar-panel h2{margin:0 0 10px;color:#333;font-size:18px}.avatar-panel p{margin:0;color:#999;font-size:12px;line-height:1.8}.avatar-panel .upload-button{width:100%;margin:0 0 12px;border-radius:2px}.avatar-panel .upload-button .el-icon{margin-right:5px}.avatar-file-input{display:none}.profile-form{max-width:560px}.account-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px}.account-item{padding:12px 14px;border:1px solid #eee;background:#fafafa}.account-item span,.account-item strong{display:block}.account-item span{margin-bottom:5px;color:#999;font-size:12px}.account-item strong{overflow:hidden;color:#555;font-size:14px;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.profile-form :deep(.el-form-item){margin-bottom:22px}.profile-form :deep(.el-form-item__label){padding-bottom:7px;color:#555;font-weight:600}.profile-form :deep(.el-input__wrapper){border-radius:2px}.profile-form :deep(.el-input__wrapper.is-focus){box-shadow:0 0 0 1px #e1251b inset}.profile-form :deep(.el-date-editor){width:100%}.gender-group{display:flex}.gender-group :deep(.el-radio-button__inner){min-width:78px}.gender-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner){border-color:#e1251b;background:#e1251b;box-shadow:-1px 0 0 0 #e1251b}.form-actions{display:flex;justify-content:flex-end;gap:12px;padding-top:9px;border-top:1px solid #f0f0f0}.form-actions .el-button{min-width:112px;margin:18px 0 0;border-radius:2px}.error-area{display:flex;min-height:440px;flex-direction:column;align-items:center;justify-content:center;text-align:center}.error-area>span{display:grid;width:64px;height:64px;place-items:center;border-radius:50%;color:#e1251b;background:#fff1f0;font-size:30px;font-weight:700}.error-area h2{margin:18px 0 8px;font-size:18px}.error-area p{margin:0 0 22px;color:#999;font-size:13px}.error-area .el-button{border-radius:2px}
@media(max-width:760px){.profile-edit-page{padding:12px 10px 28px}.card-header{min-height:82px;padding:0 18px}.card-header h1{font-size:19px}.edit-content{grid-template-columns:1fr;gap:28px;padding:28px 18px 34px}.avatar-panel{padding:0 0 26px;border-right:0;border-bottom:1px solid #eee}.avatar-preview{width:104px;height:104px}.avatar-panel p{max-width:340px;margin:0 auto}.profile-form{max-width:none}.account-row{grid-template-columns:1fr}.form-actions{display:grid;grid-template-columns:1fr 1fr}.form-actions .el-button{width:100%}}
</style>
