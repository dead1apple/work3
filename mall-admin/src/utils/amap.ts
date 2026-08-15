// 高德地图 JS API 2.0 加载器
// key 与安全密钥（securityJsCode）来自项目配置
const AMAP_KEY = '950347df75155c9a8e4cad7d54595bc0'
const AMAP_SECURITY_CODE = 'acca53c152c754b940fcf9d5831ab902'

// 最小化的 AMap 类型声明（按需使用）
export interface AmapMapOptions {
  center?: [number, number]
  zoom?: number
  resizeEnable?: boolean
  viewMode?: string
}
export interface AmapMarkerOptions {
  position?: [number, number]
  title?: string
  content?: string | HTMLElement
  offset?: unknown
}
export interface AmapInfoWindowOptions {
  content?: string | HTMLElement
  offset?: unknown
}
export interface AmapMap {
  destroy(): void
  setFitView(markers?: unknown[]): void
  setZoomAndCenter(zoom: number, center: [number, number]): void
  clearMap(): void
  on?(event: string, handler: () => void): void
}
export interface AmapMarker {
  setMap(map: AmapMap | null): void
  on?(event: string, handler: () => void): void
  getPosition?(): { lng: number, lat: number }
}
export interface AmapInfoWindow {
  open(map: AmapMap, marker?: unknown): void
  close(): void
  setContent?(content: string | HTMLElement): void
}
export interface AmapApi {
  Map: new (container: HTMLElement, options?: AmapMapOptions) => AmapMap
  Marker: new (options?: AmapMarkerOptions) => AmapMarker
  InfoWindow: new (options?: AmapInfoWindowOptions) => AmapInfoWindow
  Pixel: new (x: number, y: number) => unknown
  event?: {
    addListener(instance: unknown, event: string, handler: (event?: unknown) => void): unknown
  }
}

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string }
    AMap?: AmapApi
  }
}

let scriptPromise: Promise<AmapApi> | null = null

export function loadAmap(): Promise<AmapApi> {
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }
  if (scriptPromise) {
    return scriptPromise
  }
  window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE }
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    script.async = true
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        reject(new Error('高德地图加载失败：AMap 未初始化'))
      }
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('高德地图脚本加载失败'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function parseLocation(location?: string): [number, number] | null {
  if (!location) return null
  const parts = location.split(',').map((part) => Number(part.trim()))
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null
  }
  return [parts[0], parts[1]]
}
