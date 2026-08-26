import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { pinia } from './store'
import { useSessionStore } from './store/session'
import { useShopStore } from './store/shop'
import { setUnauthorizedHandler } from './utils/request'
import './styles/base.css'

const app = createApp(App)
const session = useSessionStore(pinia)
const shop = useShopStore(pinia)

setUnauthorizedHandler(() => {
  const currentRoute = router.currentRoute.value
  session.invalidate()
  shop.reset()

  if (currentRoute.meta.requiresMerchant) {
    const redirect = currentRoute.fullPath.startsWith('//') ? '/' : currentRoute.fullPath
    void router.replace({ name: 'login', query: { redirect } })
  }
})

app.use(pinia)
app.use(router)
app.mount('#app')
