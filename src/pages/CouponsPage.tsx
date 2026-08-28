import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleDollarSign, Pencil, Plus, Power, Search, TicketPercent } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { Coupon, CouponForm } from '../api/types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Drawer } from '../components/Drawer'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { summarizeCoupons, toApiDateTime, toDateTimeInput } from '../utils/admin'
import { currency, shortDate } from '../utils/format'

const PAGE_SIZE = 8
const couponTypeNames: Record<number, string> = { 1: '满减券', 2: '折扣券', 3: '无门槛券' }

function CouponEditor({ coupon, pending, error, onSubmit }: { coupon: Coupon | null, pending: boolean, error?: string, onSubmit: (form: CouponForm) => void }) {
  const defaultEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16)
  const [name, setName] = useState(coupon?.name || '')
  const [type, setType] = useState(coupon?.type || 1)
  const [amount, setAmount] = useState(String(coupon?.amount ?? ''))
  const [minAmount, setMinAmount] = useState(String(coupon?.minAmount ?? 0))
  const [totalCount, setTotalCount] = useState(String(coupon?.totalCount ?? ''))
  const [shopId, setShopId] = useState(coupon?.shopId ? String(coupon.shopId) : '')
  const [startTime, setStartTime] = useState(toDateTimeInput(coupon?.startTime) || new Date().toISOString().slice(0, 16))
  const [endTime, setEndTime] = useState(toDateTimeInput(coupon?.endTime) || defaultEnd)
  const [status, setStatus] = useState(coupon?.status ?? 1)
  const valid = name.trim() && Number(amount) > 0 && Number(totalCount) > 0 && startTime && endTime && endTime > startTime

  return <form id="coupon-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ name: name.trim(), type, amount: Number(amount), minAmount: Number(minAmount || 0), totalCount: Number(totalCount), shopId: shopId ? Number(shopId) : null, startTime: toApiDateTime(startTime), endTime: toApiDateTime(endTime), status }) }}>
    <div className="form-grid"><label className="form-field form-span-2"><span>优惠券名称</span><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：新客满 100 减 20" /></label><label className="form-field"><span>券类型</span><select value={type} onChange={(event) => setType(Number(event.target.value))}>{Object.entries(couponTypeNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="form-field"><span>{type === 2 ? '折扣值（例如 85 表示 8.5 折）' : '优惠金额'}</span><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label className="form-field"><span>使用门槛</span><input type="number" min="0" step="0.01" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} /></label><label className="form-field"><span>发行总量</span><input required type="number" min="1" step="1" value={totalCount} onChange={(event) => setTotalCount(event.target.value)} /></label><label className="form-field"><span>适用店铺 ID</span><input type="number" min="1" value={shopId} onChange={(event) => setShopId(event.target.value)} placeholder="留空表示全平台" /></label><label className="form-field"><span>初始状态</span><select value={status} onChange={(event) => setStatus(Number(event.target.value))}><option value={1}>启用</option><option value={0}>停用</option></select></label><label className="form-field"><span>开始时间</span><input required type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label className="form-field"><span>结束时间</span><input required type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label></div>
    {endTime && startTime && endTime <= startTime && <div className="form-error">结束时间必须晚于开始时间</div>}{error && <div className="form-error" role="alert">{error}</div>}
    <input className="sr-only" type="submit" disabled={pending || !valid} />
  </form>
}

export function CouponsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const [status, setStatus] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [statusTarget, setStatusTarget] = useState<Coupon | null>(null)
  const [notice, setNotice] = useState('')
  const query = useQuery({ queryKey: ['coupon-list', deferredKeyword, status, page], queryFn: () => adminApi.couponList({ keyword: deferredKeyword, status, page, size: PAGE_SIZE }) })
  const statsQuery = useQuery({ queryKey: ['coupon-stats', deferredKeyword, status], queryFn: () => adminApi.couponList({ keyword: deferredKeyword, status, page: 1, size: 1000 }) })
  const stats = useMemo(() => summarizeCoupons(statsQuery.data?.list || []), [statsQuery.data])
  const saveMutation = useMutation({
    mutationFn: async (form: CouponForm) => { if (editing) await adminApi.updateCoupon(editing.id, form); else await adminApi.createCoupon(form) },
    onSuccess: () => { setNotice(editing ? '优惠券已更新' : '优惠券已创建'); setEditorOpen(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['coupon-list'] }); queryClient.invalidateQueries({ queryKey: ['coupon-stats'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }) },
  })
  const statusMutation = useMutation({ mutationFn: (coupon: Coupon) => adminApi.setCouponStatus(coupon.id, coupon.status === 1 ? 0 : 1), onSuccess: (_, coupon) => { setNotice(`${coupon.name} 已${coupon.status === 1 ? '停用' : '启用'}`); setStatusTarget(null); queryClient.invalidateQueries({ queryKey: ['coupon-list'] }); queryClient.invalidateQueries({ queryKey: ['coupon-stats'] }) } })

  const openCreate = () => { setEditing(null); setEditorOpen(true); saveMutation.reset() }
  const openEdit = (coupon: Coupon) => { setEditing(coupon); setEditorOpen(true); saveMutation.reset() }

  return <div className="page-stack">
    <PageTitle title="优惠券管理" description="维护优惠券模板、发行状态与核销表现" actions={<button className="primary-button" type="button" onClick={openCreate}><Plus />新建优惠券</button>} />
    {notice && <div className="feedback-banner" role="status"><TicketPercent />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}
    <section className="summary-strip" aria-label="优惠券统计"><div><span>模板数量</span><strong>{statsQuery.data?.total ?? stats.templates}</strong></div><div><span>启用模板</span><strong>{stats.active}</strong></div><div><span>累计领取</span><strong>{stats.issued}</strong></div><div><span>累计核销</span><strong>{stats.used}</strong></div><div><span>剩余库存</span><strong>{stats.remaining}</strong></div><div><span>核销率</span><strong>{stats.usageRate}%</strong></div></section>
    <section className="content-section table-section">
      <div className="table-toolbar"><div className="search-box"><Search /><input aria-label="搜索优惠券" placeholder="搜索优惠券名称" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }} /></div><select aria-label="按优惠券状态筛选" value={status} onChange={(event) => { setStatus(event.target.value === '' ? '' : Number(event.target.value)); setPage(1) }}><option value="">全部状态</option><option value="1">启用</option><option value="0">停用</option></select></div>
      {query.isLoading ? <StatePanel type="loading" /> : query.isError ? <StatePanel type="error" message={query.error.message} onRetry={() => query.refetch()} /> : !query.data?.list.length ? <StatePanel type="empty" /> : <><div className="table-scroll"><table className="data-table coupon-table"><thead><tr><th>优惠券</th><th>优惠内容</th><th>发行范围</th><th>领取进度</th><th>核销情况</th><th>有效期</th><th>状态</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{query.data.list.map((coupon) => { const issuedRate = coupon.totalCount ? coupon.issuedCount / coupon.totalCount * 100 : 0; const usedRate = coupon.issuedCount ? coupon.usedCount / coupon.issuedCount * 100 : 0; return <tr key={coupon.id}><td><div className="coupon-name"><span><TicketPercent /></span><div><strong>{coupon.name}</strong><small>{couponTypeNames[coupon.type]}</small></div></div></td><td><div className="stacked-cell"><strong>{coupon.type === 2 ? `${Number(coupon.amount) / 10} 折` : currency(coupon.amount)}</strong><span>{coupon.minAmount ? `满 ${currency(coupon.minAmount)} 可用` : '无使用门槛'}</span></div></td><td>{coupon.shopId ? `店铺 #${coupon.shopId}` : '全平台'}</td><td><div className="progress-cell"><span>{coupon.issuedCount} / {coupon.totalCount}</span><div><i style={{ width: `${Math.min(100, issuedRate)}%` }} /></div></div></td><td><div className="progress-cell"><span>{coupon.usedCount} 张 · {usedRate.toFixed(1)}%</span><div><i className="progress-orange" style={{ width: `${Math.min(100, usedRate)}%` }} /></div></div></td><td><div className="stacked-cell"><strong>{shortDate(coupon.startTime)}</strong><span>至 {shortDate(coupon.endTime)}</span></div></td><td><StatusBadge tone={coupon.status === 1 ? 'success' : 'muted'}>{coupon.status === 1 ? '发放中' : '已停用'}</StatusBadge></td><td className="action-cell"><div className="row-actions"><button className="icon-button" type="button" title="编辑优惠券" aria-label={`编辑 ${coupon.name}`} onClick={() => openEdit(coupon)}><Pencil /></button><button className={`icon-button ${coupon.status === 1 ? 'action-danger' : 'action-success'}`} type="button" title={coupon.status === 1 ? '停用优惠券' : '启用优惠券'} aria-label={`${coupon.status === 1 ? '停用' : '启用'} ${coupon.name}`} onClick={() => setStatusTarget(coupon)}><Power /></button></div></td></tr> })}</tbody></table></div><Pagination page={page} size={PAGE_SIZE} total={query.data.total} onChange={setPage} /></>}
    </section>
    <Drawer open={editorOpen} title={editing ? '编辑优惠券' : '新建优惠券'} subtitle={editing ? `模板 ID ${editing.id}` : '创建新的发行模板'} onClose={() => { setEditorOpen(false); setEditing(null) }} footer={<><button className="secondary-button" type="button" onClick={() => { setEditorOpen(false); setEditing(null) }}>取消</button><button className="primary-button" type="submit" form="coupon-form" disabled={saveMutation.isPending}><CircleDollarSign />{saveMutation.isPending ? '保存中' : '保存优惠券'}</button></>}><CouponEditor key={editing?.id || 'new'} coupon={editing} pending={saveMutation.isPending} error={saveMutation.error?.message} onSubmit={(form) => saveMutation.mutate(form)} /></Drawer>
    <ConfirmDialog open={Boolean(statusTarget)} title={statusTarget?.status === 1 ? '停用这张优惠券？' : '启用这张优惠券？'} description={statusTarget ? `“${statusTarget.name}”${statusTarget.status === 1 ? '将停止继续发放。' : '将恢复发放。'}` : ''} confirmText={statusTarget?.status === 1 ? '确认停用' : '确认启用'} tone={statusTarget?.status === 1 ? 'danger' : 'primary'} pending={statusMutation.isPending} onCancel={() => setStatusTarget(null)} onConfirm={() => statusTarget && statusMutation.mutate(statusTarget)} />
  </div>
}
