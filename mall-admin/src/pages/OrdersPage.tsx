import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Download, Eye, MapPin, PackageCheck, ReceiptText, RotateCcw, Search, Truck, X } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { Order, OrderDetail } from '../api/types'
import { Drawer } from '../components/Drawer'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { orderExportRows } from '../utils/admin'
import { downloadCsv } from '../utils/export'
import { currency, orderStatusNames, shortDateTime, statusTone } from '../utils/format'

const PAGE_SIZE = 8
type OrderOperation = 'deliver' | 'close' | 'refund'

function OperationDialog({ operation, detail, pending, error, onCancel, onSubmit }: { operation: OrderOperation | null, detail?: OrderDetail, pending: boolean, error?: string, onCancel: () => void, onSubmit: (values: { company: string, logisticsNo: string, reason: string, amount: number }) => void }) {
  const [company, setCompany] = useState('')
  const [logisticsNo, setLogisticsNo] = useState('')
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  if (!operation || !detail) return null
  const refundable = Math.max(0, Number(detail.order.payAmount) - (detail.refunds || []).reduce((sum, refund) => sum + Number(refund.amount), 0))
  const valid = operation === 'deliver' ? company.trim() && logisticsNo.trim() : operation === 'close' ? reason.trim() : reason.trim() && Number(amount) > 0 && Number(amount) <= refundable
  const titles = { deliver: '登记订单发货', close: '关闭待付款订单', refund: '发起订单退款' }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <form className="dialog operation-dialog" role="dialog" aria-modal="true" aria-labelledby="operation-title" onSubmit={(event) => { event.preventDefault(); onSubmit({ company: company.trim(), logisticsNo: logisticsNo.trim(), reason: reason.trim(), amount: Number(amount) }) }}>
      <button className="icon-button dialog-close" type="button" title="关闭" aria-label="关闭" onClick={onCancel}><X /></button>
      <div className={`dialog-icon ${operation === 'deliver' ? 'dialog-primary' : 'dialog-danger'}`}>{operation === 'deliver' ? <Truck /> : operation === 'close' ? <Ban /> : <RotateCcw />}</div>
      <h2 id="operation-title">{titles[operation]}</h2><p>订单 {detail.order.orderNo}</p>
      {operation === 'deliver' && <div className="form-grid"><label className="form-field"><span>物流公司</span><input autoFocus required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="例如：顺丰速运" /></label><label className="form-field"><span>物流单号</span><input required value={logisticsNo} onChange={(event) => setLogisticsNo(event.target.value)} placeholder="填写承运单号" /></label></div>}
      {operation === 'refund' && <label className="form-field"><span>退款金额（最多 {currency(refundable)}）</span><input autoFocus required type="number" min="0.01" max={refundable} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>}
      {operation !== 'deliver' && <label className="form-field"><span>{operation === 'close' ? '关闭原因' : '退款原因'}</span><textarea autoFocus={operation === 'close'} required rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="填写操作原因" /></label>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="dialog-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={pending}>取消</button><button className={operation === 'deliver' ? 'primary-button' : 'danger-button'} type="submit" disabled={pending || !valid}>{pending ? '提交中...' : '确认提交'}</button></div>
    </form>
  </div>
}

export function OrdersPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const [status, setStatus] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [selectedNo, setSelectedNo] = useState<string | null>(null)
  const [operation, setOperation] = useState<OrderOperation | null>(null)
  const [notice, setNotice] = useState('')
  const [exporting, setExporting] = useState(false)
  const query = useQuery({ queryKey: ['orders', deferredKeyword, status, page], queryFn: () => adminApi.orders({ keyword: deferredKeyword, status, page, size: PAGE_SIZE }) })
  const detailQuery = useQuery({ queryKey: ['order-detail', selectedNo], queryFn: () => adminApi.orderDetail(selectedNo!), enabled: selectedNo != null })
  const operationMutation = useMutation({
    mutationFn: ({ type, values }: { type: OrderOperation, values: { company: string, logisticsNo: string, reason: string, amount: number } }) => {
      if (!selectedNo) throw new Error('未选择订单')
      if (type === 'deliver') return adminApi.deliverOrder(selectedNo, values.company, values.logisticsNo)
      if (type === 'close') return adminApi.closeOrder(selectedNo, values.reason)
      return adminApi.refundOrder(selectedNo, values.amount, values.reason)
    },
    onSuccess: (_, variables) => {
      setNotice(variables.type === 'deliver' ? '发货信息已登记' : variables.type === 'close' ? '订单已关闭' : '退款已提交')
      setOperation(null)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-detail', selectedNo] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const pageAmount = query.data?.list.reduce((sum, order) => sum + Number(order.payAmount), 0) ?? 0
  const exportOrders = async () => {
    setExporting(true)
    try {
      const result = await adminApi.orders({ keyword: deferredKeyword, status, page: 1, size: 1000 })
      downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, ['订单号', '收货人', '手机号', '实付金额', '状态', '物流公司', '物流单号', '收货地址', '下单时间'], orderExportRows(result.list))
      setNotice(`已导出 ${result.list.length} 条订单`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '订单导出失败')
    } finally {
      setExporting(false)
    }
  }

  return <div className="page-stack">
    <PageTitle title="订单管理" description="查询订单并处理发货、关闭与退款" actions={<div className="page-actions"><span className="summary-label"><ReceiptText />本页交易 {currency(pageAmount)}</span><button className="secondary-button" type="button" disabled={exporting} onClick={exportOrders}><Download />{exporting ? '导出中' : '导出 CSV'}</button></div>} />
    {notice && <div className="feedback-banner" role="status"><ReceiptText />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}
    <section className="content-section table-section">
      <div className="table-toolbar"><div className="search-box"><Search /><input aria-label="搜索订单" placeholder="搜索订单号或收货人" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }} /></div><select aria-label="按订单状态筛选" value={status} onChange={(event) => { setStatus(event.target.value === '' ? '' : Number(event.target.value)); setPage(1) }}><option value="">全部状态</option>{Object.entries(orderStatusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {query.isLoading ? <StatePanel type="loading" /> : query.isError ? <StatePanel type="error" message={query.error.message} onRetry={() => query.refetch()} /> : !query.data?.list.length ? <StatePanel type="empty" /> : <><div className="table-scroll"><table className="data-table"><thead><tr><th>订单号</th><th>收货人</th><th>金额</th><th>店铺</th><th>状态</th><th>下单时间</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{query.data.list.map((order: Order) => <tr key={order.id}><td><div className="stacked-cell"><strong>{order.orderNo}</strong><span>用户 ID {order.userId || '-'}</span></div></td><td><div className="stacked-cell"><strong>{order.receiverName}</strong><span>{order.receiverPhone || '-'}</span></div></td><td><div className="stacked-cell"><strong>{currency(order.payAmount)}</strong>{order.discountAmount ? <span>优惠 {currency(order.discountAmount)}</span> : <span>无优惠</span>}</div></td><td>#{order.shopId || '-'}</td><td><StatusBadge tone={statusTone(order.status, 'order')}>{orderStatusNames[order.status]}</StatusBadge></td><td>{shortDateTime(order.createTime)}</td><td className="action-cell"><button className="icon-button" type="button" title="查看详情" aria-label={`查看订单 ${order.orderNo}`} onClick={() => setSelectedNo(order.orderNo)}><Eye /></button></td></tr>)}</tbody></table></div><Pagination page={page} size={PAGE_SIZE} total={query.data.total} onChange={setPage} /></>}
    </section>
    <Drawer open={selectedNo != null} title={selectedNo || '订单详情'} subtitle={detailQuery.data ? `${detailQuery.data.order.receiverName} · ${orderStatusNames[detailQuery.data.order.status]}` : '正在加载订单资料'} width="wide" onClose={() => { setSelectedNo(null); setOperation(null) }} footer={detailQuery.data && <>{detailQuery.data.order.status === 0 && <button className="danger-button" type="button" onClick={() => setOperation('close')}><Ban />关闭订单</button>}{[1, 2, 3].includes(detailQuery.data.order.status) && <button className="secondary-button action-danger-text" type="button" onClick={() => setOperation('refund')}><RotateCcw />退款</button>}{detailQuery.data.order.status === 1 && <button className="primary-button" type="button" onClick={() => setOperation('deliver')}><Truck />登记发货</button>}</>}>
      {detailQuery.isLoading ? <StatePanel type="loading" /> : detailQuery.isError || !detailQuery.data ? <StatePanel type="error" message={detailQuery.error?.message} onRetry={() => detailQuery.refetch()} /> : <>
        <section className="detail-block"><div className="detail-status-line"><StatusBadge tone={statusTone(detailQuery.data.order.status, 'order')}>{orderStatusNames[detailQuery.data.order.status]}</StatusBadge><strong>{currency(detailQuery.data.order.payAmount)}</strong></div><div className="definition-grid definition-grid-spaced"><div><span>订单总额</span><strong>{currency(detailQuery.data.order.totalAmount)}</strong></div><div><span>运费</span><strong>{currency(detailQuery.data.order.freightAmount || 0)}</strong></div><div><span>优惠</span><strong>{currency(detailQuery.data.order.discountAmount || 0)}</strong></div><div><span>支付时间</span><strong>{shortDateTime(detailQuery.data.order.payTime)}</strong></div></div></section>
        <section className="detail-block"><h3><MapPin />收货与物流</h3><div className="detail-line"><MapPin /><div><span>{detailQuery.data.order.receiverName} · {detailQuery.data.order.receiverPhone || '-'}</span><p>{detailQuery.data.order.receiverAddress || '暂无收货地址'}</p></div></div><div className="detail-line"><Truck /><div><span>物流信息</span><p>{detailQuery.data.order.logisticsCompany ? `${detailQuery.data.order.logisticsCompany} · ${detailQuery.data.order.logisticsNo}` : '暂未登记物流信息'}</p></div></div></section>
        <section className="detail-block"><h3><PackageCheck />商品明细 · {detailQuery.data.items.length}</h3><div className="mini-list">{detailQuery.data.items.map((item) => <div className="mini-list-row" key={item.id}>{item.skuImage ? <img className="mini-image" src={item.skuImage} alt="" /> : <PackageCheck />}<div><strong>{item.productName}</strong><span>{item.skuName} · {currency(item.price)} × {item.quantity}</span></div><b>{currency(item.totalAmount)}</b></div>)}</div></section>
        {detailQuery.data.payment && <section className="detail-block"><h3>支付记录</h3><div className="definition-grid"><div><span>支付单号</span><strong>{detailQuery.data.payment.paymentNo}</strong></div><div><span>支付金额</span><strong>{currency(detailQuery.data.payment.amount)}</strong></div><div><span>第三方单号</span><strong>{detailQuery.data.payment.thirdPartyNo || '-'}</strong></div><div><span>支付时间</span><strong>{shortDateTime(detailQuery.data.payment.payTime)}</strong></div></div></section>}
        <section className="detail-block"><h3><RotateCcw />退款记录 · {detailQuery.data.refunds?.length || 0}</h3>{detailQuery.data.refunds?.length ? <div className="mini-list">{detailQuery.data.refunds.map((refund) => <div className="mini-list-row" key={refund.id}><RotateCcw /><div><strong>{currency(refund.amount)} · {refund.operatorName}</strong><span>{refund.reason} · {shortDateTime(refund.createTime)}</span></div><StatusBadge tone={refund.status === 1 ? 'success' : 'warning'}>{refund.status === 1 ? '已退款' : '处理中'}</StatusBadge></div>)}</div> : <p className="empty-inline">暂无退款记录</p>}</section>
      </>}
    </Drawer>
    <OperationDialog key={`${selectedNo}-${operation}`} operation={operation} detail={detailQuery.data} pending={operationMutation.isPending} error={operationMutation.error?.message} onCancel={() => setOperation(null)} onSubmit={(values) => operation && operationMutation.mutate({ type: operation, values })} />
  </div>
}
