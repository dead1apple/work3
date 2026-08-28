import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Eye, PackageCheck, ReceiptText, Search, ShieldX, Star, Store } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { Shop } from '../api/types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Drawer } from '../components/Drawer'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { currency, initials, orderStatusNames, shopStatusNames, shortDate, shortDateTime, statusTone } from '../utils/format'

const PAGE_SIZE = 8
type ShopAction = { shop: Shop, nextStatus: number, label: string } | null

export function ShopsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const [status, setStatus] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<ShopAction>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const query = useQuery({
    queryKey: ['shops', deferredKeyword, status, page],
    queryFn: () => adminApi.shops({ keyword: deferredKeyword, status, page, size: PAGE_SIZE }),
  })
  const detailQuery = useQuery({
    queryKey: ['shop-detail', detailId],
    queryFn: () => adminApi.shopDetail(detailId!),
    enabled: detailId != null,
  })
  const mutation = useMutation({
    mutationFn: ({ shop, nextStatus }: NonNullable<ShopAction>) => adminApi.auditShop(shop.id, nextStatus),
    onSuccess: (_, variables) => {
      setNotice(`${variables.shop.shopName} 已${variables.label}`)
      setAction(null)
      queryClient.invalidateQueries({ queryKey: ['shops'] })
      queryClient.invalidateQueries({ queryKey: ['shops-map'] })
      queryClient.invalidateQueries({ queryKey: ['admin-snapshot'] })
    },
  })

  return (
    <div className="page-stack">
      <PageTitle title="店铺管理" description="审核入驻店铺并维护平台经营状态" actions={<span className="summary-label"><Store />平台店铺 {query.data?.total ?? 0}</span>} />
      {notice && <div className="feedback-banner" role="status"><Store />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}
      <section className="content-section table-section">
        <div className="table-toolbar">
          <div className="search-box"><Search /><input aria-label="搜索店铺" placeholder="搜索店铺名称" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }} /></div>
          <select aria-label="按店铺状态筛选" value={status} onChange={(event) => { setStatus(event.target.value === '' ? '' : Number(event.target.value)); setPage(1) }}>
            <option value="">全部状态</option>{Object.entries(shopStatusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {query.isLoading ? <StatePanel type="loading" /> : query.isError ? <StatePanel type="error" message={query.error.message} onRetry={() => query.refetch()} /> : !query.data?.list.length ? <StatePanel type="empty" /> : (
          <>
            <div className="table-scroll"><table className="data-table">
              <thead><tr><th>店铺</th><th>店主</th><th>评分</th><th>状态</th><th>入驻日期</th><th><span className="sr-only">操作</span></th></tr></thead>
              <tbody>{query.data.list.map((shop) => <tr key={shop.id}>
                <td><div className="entity-cell">{shop.logo ? <img src={shop.logo} alt="" /> : <span className="avatar-fallback shop-avatar">{initials(shop.shopName)}</span>}<div><strong>{shop.shopName}</strong><span>{shop.description || `店铺 ID ${shop.id}`}</span></div></div></td>
                <td>用户 #{shop.userId || '-'}</td>
                <td><span className="rating"><Star />{Number(shop.rating).toFixed(1)}</span></td>
                <td><StatusBadge tone={statusTone(shop.status, 'shop')}>{shopStatusNames[shop.status]}</StatusBadge></td>
                <td>{shortDate(shop.createTime)}</td>
                <td className="action-cell"><div className="row-actions">
                  <button className="icon-button" type="button" title="查看详情" aria-label={`查看 ${shop.shopName}`} onClick={() => setDetailId(shop.id)}><Eye /></button>
                  {shop.status !== 1 && <button className="icon-button action-success" type="button" title="通过并营业" aria-label={`通过 ${shop.shopName}`} onClick={() => setAction({ shop, nextStatus: 1, label: '审核通过' })}><Check /></button>}
                  {shop.status === 1 && <button className="icon-button action-danger" type="button" title="禁用店铺" aria-label={`禁用 ${shop.shopName}`} onClick={() => setAction({ shop, nextStatus: 2, label: '禁用' })}><ShieldX /></button>}
                  {shop.status === 0 && <button className="icon-button action-danger" type="button" title="拒绝入驻" aria-label={`拒绝 ${shop.shopName}`} onClick={() => setAction({ shop, nextStatus: 3, label: '拒绝入驻' })}><ShieldX /></button>}
                </div></td>
              </tr>)}</tbody>
            </table></div>
            <Pagination page={page} size={PAGE_SIZE} total={query.data.total} onChange={setPage} />
          </>
        )}
      </section>
      <Drawer open={detailId != null} title={detailQuery.data?.shop.shopName || '店铺详情'} subtitle={detailQuery.data ? `店铺 ID ${detailQuery.data.shop.id} · 店主 #${detailQuery.data.shop.userId || '-'}` : '正在加载店铺资料'} width="wide" onClose={() => setDetailId(null)}>
        {detailQuery.isLoading ? <StatePanel type="loading" /> : detailQuery.isError || !detailQuery.data ? <StatePanel type="error" message={detailQuery.error?.message} onRetry={() => detailQuery.refetch()} /> : <>
          <section className="detail-block entity-overview">{detailQuery.data.shop.logo ? <img src={detailQuery.data.shop.logo} alt="" /> : <span className="entity-overview-placeholder"><Store /></span>}<div><StatusBadge tone={statusTone(detailQuery.data.shop.status, 'shop')}>{shopStatusNames[detailQuery.data.shop.status]}</StatusBadge><p>{detailQuery.data.shop.description || '暂无店铺介绍'}</p></div></section>
          <section className="detail-block"><h3>店铺资料</h3><div className="definition-grid"><div><span>店主用户</span><strong>#{detailQuery.data.shop.userId || '-'}</strong></div><div><span>综合评分</span><strong>{Number(detailQuery.data.shop.rating).toFixed(1)}</strong></div><div><span>入驻时间</span><strong>{shortDateTime(detailQuery.data.shop.createTime)}</strong></div><div><span>在店商品</span><strong>{detailQuery.data.products.length}</strong></div></div>{detailQuery.data.shop.licenseImage && <a className="license-link" href={detailQuery.data.shop.licenseImage} target="_blank" rel="noreferrer">查看营业执照</a>}</section>
          <section className="detail-block"><h3><PackageCheck />店铺商品 · {detailQuery.data.products.length}</h3><div className="mini-list">{detailQuery.data.products.length ? detailQuery.data.products.map(({ product, minPrice, totalStock }) => <div className="mini-list-row" key={product.id}>{product.mainImage ? <img className="mini-image" src={product.mainImage} alt="" /> : <PackageCheck />}<div><strong>{product.name}</strong><span>{currency(minPrice)} · 库存 {totalStock} · 销量 {product.salesCount}</span></div><StatusBadge tone={statusTone(product.status, 'product')}>{product.status === 1 ? '销售中' : product.status === 2 ? '待审核' : '已下架'}</StatusBadge></div>) : <p className="empty-inline">暂无商品</p>}</div></section>
          <section className="detail-block"><h3><ReceiptText />最近订单 · {detailQuery.data.orders.length}</h3><div className="mini-list">{detailQuery.data.orders.length ? detailQuery.data.orders.map((order) => <div className="mini-list-row" key={order.id}><ReceiptText /><div><strong>{order.orderNo}</strong><span>{shortDate(order.createTime)} · {orderStatusNames[order.status]}</span></div><b>{currency(order.payAmount)}</b></div>) : <p className="empty-inline">暂无订单</p>}</div></section>
        </>}
      </Drawer>
      <ConfirmDialog open={Boolean(action)} title={`${action?.label || '更新'}这个店铺？`} description={action ? `“${action.shop.shopName}”的经营状态将立即更新。` : ''} confirmText={`确认${action?.label || ''}`} tone={action?.nextStatus === 1 ? 'primary' : 'danger'} pending={mutation.isPending} onCancel={() => setAction(null)} onConfirm={() => action && mutation.mutate(action)} />
    </div>
  )
}
