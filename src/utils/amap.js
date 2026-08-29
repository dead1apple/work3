const AMAP_KEY = '950347df75155c9a8e4cad7d54595bc0'
const AMAP_VERSION = '2.0'
// JSAPI 2.0 的新 key 若在高德控制台配置了安全密钥，需在此填入
const AMAP_SECURITY_CODE = 'acca53c152c754b940fcf9d5831ab902'

let amapPromise = null

export function loadAMap() {
  if (typeof window === 'undefined') return Promise.reject(new Error('仅浏览器环境可用'))
  if (window.AMap) return Promise.resolve(window.AMap)
  if (amapPromise) return amapPromise

  amapPromise = new Promise((resolve, reject) => {
    if (AMAP_SECURITY_CODE) window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_KEY}`
    script.async = true
    script.onload = () => {
      if (window.AMap) resolve(window.AMap)
      else {
        amapPromise = null
        reject(new Error('高德地图脚本加载异常'))
      }
    }
    script.onerror = () => {
      amapPromise = null
      reject(new Error('高德地图脚本加载失败'))
    }
    document.head.appendChild(script)
  })
  return amapPromise
}
