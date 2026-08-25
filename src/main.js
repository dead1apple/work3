import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { pinia } from './store'
import { useSessionStore } from './store/session'
import { setUnauthorizedHandler } from './utils/request'
import './styles/base.css'

const app = createApp(App)
const session = useSessionStore(pinia)

setUnauthorizedHandler(() => {
  const currentRoute = router.currentRoute.value
  session.invalidate()

  if (currentRoute.meta.requiresMerchant) {
    const redirect = currentRoute.fullPath.startsWith('//') ? '/' : currentRoute.fullPath
    void router.replace({ name: 'login', query: { redirect } })
  }
})

app.use(pinia)
app.use(router)
app.mount('#app')
