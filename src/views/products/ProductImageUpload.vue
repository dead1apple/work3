<script setup>
import { ref } from 'vue'
import { ElButton, ElImage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { uploadMerchantImage } from '../../api/product'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '上传图片' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'uploaded'])
const input = ref(null)
const uploading = ref(false)
const error = ref(null)

function chooseFile() {
  input.value?.click()
}

async function upload(event) {
  const [file] = event.target.files || []
  event.target.value = ''
  if (!file || uploading.value) return

  uploading.value = true
  error.value = null
  try {
    const result = await uploadMerchantImage(file)
    emit('update:modelValue', result.url)
    emit('uploaded', result.url)
  } catch (uploadError) {
    error.value = uploadError
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="image-upload">
    <input ref="input" class="image-upload-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="upload" />
    <el-button type="primary" plain :icon="Upload" :loading="uploading" :disabled="disabled || uploading" @click="chooseFile">
      {{ uploading ? '正在上传' : label }}
    </el-button>
    <el-image v-if="props.modelValue" class="image-upload-preview" :src="props.modelValue" fit="cover" />
    <small v-if="error" class="image-upload-error" role="alert">{{ error.message || '图片上传失败' }}</small>
  </div>
</template>

<style scoped>
.image-upload { display: grid; grid-template-columns: auto 52px; align-items: center; gap: var(--space-3); }
.image-upload-input { display: none; }
.image-upload-preview { width: 52px; height: 52px; border-radius: var(--radius-small); background: var(--color-canvas); }
.image-upload-error { grid-column: 1 / -1; color: var(--el-color-danger); font-size: 12px; }
</style>
