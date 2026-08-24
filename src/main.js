import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus, { ElBadge, ElButton, ElCard, ElCarousel, ElCarouselItem, ElCheckbox, ElCol, ElEmpty, ElForm, ElFormItem, ElImage, ElInput, ElInputNumber, ElRadioButton, ElRadioGroup, ElRow, ElSkeleton, ElTable, ElTableColumn, ElTabPane, ElTabs, messageConfig } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/es/components/badge/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/carousel/style/css'
import 'element-plus/es/components/carousel-item/style/css'
import 'element-plus/es/components/col/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/empty/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/image/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/menu/style/css'
import 'element-plus/es/components/menu-item/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/radio-button/style/css'
import 'element-plus/es/components/radio-group/style/css'
import 'element-plus/es/components/row/style/css'
import 'element-plus/es/components/skeleton/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user.js'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia).use(router)
const userStore = useUserStore(pinia)
userStore.connectSessionInvalidation()
void userStore.restoreSession().catch(() => {})
app.use(ElementPlus, {
  locale: zhCn,
  zIndex: 3000,
  message: {
    placement: 'top',
    offset: 72,
    duration: 3000,
    grouping: true,
    showClose: false,
  },
})
Object.assign(messageConfig, {
  placement: 'top',
  offset: 72,
  duration: 3000,
  grouping: true,
  showClose: false,
})
app.component('ElBadge', ElBadge)
app.component('ElButton', ElButton)
app.component('ElCard', ElCard)
app.component('ElCarousel', ElCarousel)
app.component('ElCarouselItem', ElCarouselItem)
app.component('ElCol', ElCol)
app.component('ElCheckbox', ElCheckbox)
app.component('ElEmpty', ElEmpty)
app.component('ElForm', ElForm)
app.component('ElFormItem', ElFormItem)
app.component('ElInput', ElInput)
app.component('ElImage', ElImage)
app.component('ElInputNumber', ElInputNumber)
app.component('ElRadioButton', ElRadioButton)
app.component('ElRadioGroup', ElRadioGroup)
app.component('ElRow', ElRow)
app.component('ElSkeleton', ElSkeleton)
app.component('ElTable', ElTable)
app.component('ElTableColumn', ElTableColumn)
app.component('ElTabPane', ElTabPane)
app.component('ElTabs', ElTabs)
app.mount('#app')
