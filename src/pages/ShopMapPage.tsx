import { useQuery } from '@tanstack/react-query'
import { Map as MapIcon } from 'lucide-react'
import { adminApi } from '../api/admin'
import { PageTitle } from '../components/PageTitle'
import { ShopMap } from '../components/ShopMap'

export function ShopMapPage() {
  const mapQuery = useQuery({
    queryKey: ['shops-map'],
    queryFn: () => adminApi.shopMapPoints(),
  })

  return (
    <div className="page-stack">
      <PageTitle title="店铺地图" description="全平台店铺的地理分布总览" actions={<span className="summary-label"><MapIcon />共 {mapQuery.data?.length ?? 0} 家店铺</span>} />
      <section className="content-section map-page-section">
        <ShopMap
          points={mapQuery.data ?? []}
          loading={mapQuery.isLoading}
          error={mapQuery.isError ? (mapQuery.error?.message ?? '加载失败') : null}
          onRetry={() => mapQuery.refetch()}
          tall
        />
      </section>
    </div>
  )
}
