import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Eye, PackageCheck, PackageX, Search } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { ProductSummary } from '../api/types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Drawer } from '../components/Drawer'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { compactNumber, currency, productStatusNames, shortDate, statusTone } from '../utils/format'

const PAGE_SIZE = 8
type ProductAction = { item: ProductSummary, nextStatus: number, label: string } | null

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const [status, setStatus] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<ProductAction>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const query = useQuery({
    queryKey: ['products', deferredKeyword, status, page],
    queryFn: () => adminApi.products({ keyword: deferredKeyword, status, page, size: PAGE_SIZE }),
  })
  const detailQuery = useQuery({
    queryKey: ['product-detail', detailId],
    queryFn: () => adminApi.productDetail(detailId!),
    enabled: detailId != null,
  })
  const mutation = useMutation({
    mutationFn: ({ item, nextStatus }: NonNullable<ProductAction>) => adminApi.auditProduct(item.product.id, nextStatus),
    onSuccess: (_, variables) => {
      setNotice(`${variables.item.product.name} 已${variables.label}`)
      setAction(null)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-snapshot'] })
    },
  })

  return (
    <div className="page-stack">
      <PageTitle title="商品审核" description="检查平台商品信息并管理上下架状态" actions={<span className="summary-label"><PackageCheck />当前记录 {query.data?.total ?? 0}</span>} />
      {notice && <div className="feedback-banner" role="status"><PackageCheck />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}
      <section className="content-section table-section">
        <div className="table-toolbar">
          <div className="search-box"><Search /><input aria-label="搜索商品" placeholder="搜索商品名称" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }} /></div>
          <select aria-label="按商品状态筛选" value={status} onChange={(event) => { setStatus(event.target.value === '' ? '' : Number(event.target.value)); setPage(1) }}><option value="">全部状态</option><option value="1">销售中</option><option value="0">已下架</option><option value="2">待审核</option></select>
        </div>
        {query.isLoading ? <StatePanel type="loading" /> : query.isError ? <StatePanel type="error" message={query.error.message} onRetry={() => query.refetch()} /> : !query.data?.list.length ? <StatePanel type="empty" /> : (
          <>
            <div className="table-scroll"><table className="data-table product-table">
              <thead><tr><th>商品</th><th>价格区间</th><th>库存</th><th>销量</th><th>状态</th><th>创建日期</th><th><span className="sr-only">操作</span></th></tr></thead>
              <tbody>{query.data.list.map((item) => {
                const product = item.product
                return <tr key={product.id}>
                  <td><div className="entity-cell product-entity">{product.mainImage ? <img src={product.mainImage} alt="" /> : <span className="avatar-fallback"><PackageCheck /></span>}<div><strong>{product.name}</strong><span>{product.subtitle || `商品 ID ${product.id}`}</span></div></div></td>
                  <td><strong>{currency(item.minPrice)}</strong>{item.maxPrice !== item.minPrice && <span className="muted-inline"> - {currency(item.maxPrice)}</span>}</td>
                  <td>{compactNumber(item.totalStock)}</td><td>{compactNumber(product.salesCount)}</td>
                  <td><StatusBadge tone={statusTone(product.status, 'product')}>{productStatusNames[product.status]}</StatusBadge></td>
                  <td>{shortDate(product.createTime)}</td>
                  <td className="action-cell"><div className="row-actions">
                    <button className="icon-button" type="button" title="查看详情" aria-label={`查看 ${product.name}`} onClick={() => setDetailId(product.id)}><Eye /></button>
                    {product.status !== 1 && <button className="icon-button action-success" type="button" title="审核通过并上架" aria-label={`上架 ${product.name}`} onClick={() => setAction({ item, nextStatus: 1, label: '审核通过并上架' })}><Check /></button>}
                    {product.status === 1 && <button className="icon-button action-danger" type="button" title="下架商品" aria-label={`下架 ${product.name}`} onClick={() => setAction({ item, nextStatus: 0, label: '下架' })}><PackageX /></button>}
                    {product.status === 2 && <button className="icon-button action-danger" type="button" title="拒绝商品" aria-label={`拒绝 ${product.name}`} onClick={() => setAction({ item, nextStatus: 0, label: '拒绝' })}><PackageX /></button>}
                  </div></td>
                </tr>
              })}</tbody>
            </table></div>
            <Pagination page={page} size={PAGE_SIZE} total={query.data.total} onChange={setPage} />
          </>
        )}
      </section>
      <Drawer open={detailId != null} title={detailQuery.data?.product.name || '商品详情'} subtitle={detailQuery.data ? `商品 ID ${detailQuery.data.product.id}` : '正在加载商品资料'} width="wide" onClose={() => setDetailId(null)}>
        {detailQuery.isLoading ? <StatePanel type="loading" /> : detailQuery.isError || !detailQuery.data ? <StatePanel type="error" message={detailQuery.error?.message} onRetry={() => detailQuery.refetch()} /> : <>
          <section className="detail-block entity-overview">{detailQuery.data.product.mainImage ? <img src={detailQuery.data.product.mainImage} alt="" /> : <span className="entity-overview-placeholder"><PackageCheck /></span>}<div><StatusBadge tone={statusTone(detailQuery.data.product.status, 'product')}>{productStatusNames[detailQuery.data.product.status]}</StatusBadge><p>{detailQuery.data.product.subtitle || '暂无商品副标题'}</p></div></section>
          <section className="detail-block"><h3>商品资料</h3><div className="definition-grid"><div><span>店铺 ID</span><strong>{detailQuery.data.product.shopId || '-'}</strong></div><div><span>分类 ID</span><strong>{detailQuery.data.product.categoryId || '-'}</strong></div><div><span>品牌 ID</span><strong>{detailQuery.data.product.brandId || '-'}</strong></div><div><span>累计销量</span><strong>{compactNumber(detailQuery.data.product.salesCount)}</strong></div><div><span>排序值</span><strong>{detailQuery.data.product.sortOrder ?? '-'}</strong></div><div><span>创建时间</span><strong>{shortDate(detailQuery.data.product.createTime)}</strong></div></div></section>
          <section className="detail-block"><h3>SKU 库存 · {detailQuery.data.skuList.length}</h3>{detailQuery.data.skuList.length ? <div className="table-scroll"><table className="data-table drawer-table"><thead><tr><th>规格</th><th>编码</th><th>售价</th><th>库存</th><th>锁定</th><th>状态</th></tr></thead><tbody>{detailQuery.data.skuList.map((sku) => <tr key={sku.id}><td><strong>{sku.skuName}</strong></td><td>{sku.skuCode || '-'}</td><td>{currency(sku.price)}</td><td>{sku.stock}</td><td>{sku.lockedStock}</td><td><StatusBadge tone={sku.status === 1 ? 'success' : 'muted'}>{sku.status === 1 ? '启用' : '停用'}</StatusBadge></td></tr>)}</tbody></table></div> : <p className="empty-inline">暂无 SKU</p>}</section>
        </>}
      </Drawer>
      <ConfirmDialog open={Boolean(action)} title={`${action?.label || '更新'}这个商品？`} description={action ? `“${action.item.product.name}”的展示状态将立即更新。` : ''} confirmText={`确认${action?.label || ''}`} tone={action?.nextStatus === 0 ? 'danger' : 'primary'} pending={mutation.isPending} onCancel={() => setAction(null)} onConfirm={() => action && mutation.mutate(action)} />
    </div>
  )
}
