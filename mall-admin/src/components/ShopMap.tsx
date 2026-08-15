import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import type { ShopMapPoint } from '../api/types'
import { shopStatusNames, statusTone } from '../utils/format'
import { loadAmap, parseLocation } from '../utils/amap'
import { StatePanel } from './StatePanel'

interface ShopMapProps {
  points: ShopMapPoint[]
  loading: boolean
  error: string | null
  onRetry?: () => void
  tall?: boolean
}

interface AmapInstance {
  destroy(): void
  setFitView(markers: unknown[]): void
}

export function ShopMap({ points, loading, error, onRetry, tall }: ShopMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false
    let mapInstance: AmapInstance | null = null
    let markers: { setMap(map: unknown | null): void }[] = []
    let infoWindow: { open(map: unknown, marker?: unknown): void; close(): void; setContent?(content: string | HTMLElement): void } | null = null

    async function initMap() {
      if (!containerRef.current) return
      try {
        const AMap = await loadAmap()
        if (disposed || !containerRef.current) return
        const map = new AMap.Map(containerRef.current, {
          zoom: 5,
          center: [113.4, 30.6],
          viewMode: '2D',
          resizeEnable: true,
          mapStyle: 'amap://styles/whitesmoke',
        })
        mapInstance = map
        infoWindow = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -12) })

        const located = points
          .map((point) => ({ point, lngLat: parseLocation(point.location) }))
          .filter((entry): entry is { point: ShopMapPoint, lngLat: [number, number] } => entry.lngLat != null)

        markers = located.map(({ point, lngLat }) => {
          const openDetail = () => {
            infoWindow?.setContent?.(createInfoContent(point, lngLat))
            infoWindow?.open(map, marker)
          }
          const marker = new AMap.Marker({
            position: lngLat,
            title: point.shopName,
            content: createMarkerContent(point, openDetail),
          })
          marker.setMap(map)
          // 自定义 content 会拦截 marker 原生事件，官方 API 兜底绑定
          AMap.event?.addListener?.(marker, 'click', openDetail)
          return marker
        })
        if (markers.length) {
          map.setFitView(markers)
        }
      } catch (err) {
        if (!disposed) {
          setLoadError(err instanceof Error ? err.message : '地图加载失败')
        }
      }
    }

    void initMap()

    return () => {
      disposed = true
      markers.forEach((marker) => marker.setMap(null))
      infoWindow?.close()
      mapInstance?.destroy()
    }
  }, [points])

  if (loading) {
    return <StatePanel type="loading" message="正在加载店铺位置" />
  }
  if (error || loadError) {
    return <StatePanel type="error" message={error || loadError || undefined} onRetry={onRetry} />
  }
  const locatedCount = points.filter((point) => parseLocation(point.location) != null).length

  return (
    <div className="map-view">
      <div className="map-view-header">
        <div>
          <strong><MapPin />店铺分布地图</strong>
          <span>共 {points.length} 家店铺，其中 {locatedCount} 家已标注位置 · 点击标记查看详情</span>
        </div>
        <a className="map-hint" href="https://lbs.amap.com" target="_blank" rel="noreferrer"><Navigation />高德地图</a>
      </div>
      <div className={`map-canvas ${tall ? 'map-canvas-tall' : ''}`} ref={containerRef} role="application" aria-label="店铺分布地图" />
      <div className="map-legend">
        {Object.entries(shopStatusNames).map(([value, label]) => (
          <span key={value}><i className={`legend-dot legend-${value}`} />{label}</span>
        ))}
      </div>
    </div>
  )
}

function createMarkerContent(point: ShopMapPoint, onClick: () => void) {
  const tone = statusTone(point.status, 'shop')
  const color = tone === 'success' ? '#10b981' : tone === 'danger' ? '#ef4444' : tone === 'warning' ? '#f59e0b' : '#94a3b8'
  const badge = document.createElement('div')
  badge.className = 'amap-marker amap-marker-compact'
  badge.style.setProperty('--marker-color', color)
  badge.innerHTML = `
    <span class="amap-marker-dot" style="background:${color}"></span>
    <span class="amap-marker-name">${escapeHtml(point.shopName)}</span>`
  badge.addEventListener('click', (event) => {
    event.stopPropagation()
    event.preventDefault()
    onClick()
  })
  return badge
}

function createInfoContent(point: ShopMapPoint, lngLat: [number, number]) {
  const tone = statusTone(point.status, 'shop')
  const color = tone === 'success' ? '#10b981' : tone === 'danger' ? '#ef4444' : tone === 'warning' ? '#f59e0b' : '#94a3b8'
  const label = shopStatusNames[point.status] || '未知状态'
  return `
    <div class="amap-info-card" style="--marker-color:${color}">
      <div class="amap-info-head">
        <span class="amap-info-dot" style="background:${color}"></span>
        <strong>${escapeHtml(point.shopName)}</strong>
        <em>${escapeHtml(label)}</em>
      </div>
      <div class="amap-info-rows">
        <div class="amap-info-row"><span class="amap-info-ico">◆</span>${escapeHtml(point.address || '未设置地址')}</div>
        <div class="amap-info-row"><span class="amap-info-ico">★</span>评分 ${Number(point.rating).toFixed(1)}</div>
        <div class="amap-info-row"><span class="amap-info-ico">◎</span>${lngLat[0].toFixed(6)}, ${lngLat[1].toFixed(6)}</div>
      </div>
    </div>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
