import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ClipboardCheck, History, Search, Store, X } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { AuditType } from '../api/types'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { SelectionBar } from '../components/SelectionBar'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { Tabs } from '../components/Tabs'
import { auditActionPresentation } from '../utils/admin'
import { shortDateTime } from '../utils/format'

const PAGE_SIZE = 10
type View = 'queue' | 'history'

function AuditActionDialog({ open, count, action, pending, onCancel, onConfirm }: { open: boolean, count: number, action: 'approve' | 'reject', pending: boolean, onCancel: () => void, onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  if (!open) return null
  const rejecting = action === 'reject'
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <div className="dialog audit-dialog" role="dialog" aria-modal="true" aria-labelledby="audit-dialog-title">
      <button className="icon-button dialog-close" type="button" title="关闭" aria-label="关闭" onClick={onCancel}><X /></button>
      <div className={`dialog-icon ${rejecting ? 'dialog-danger' : 'dialog-primary'}`}>{rejecting ? <X /> : <Check />}</div>
      <h2 id="audit-dialog-title">{rejecting ? '拒绝所选项目？' : '通过所选项目？'}</h2>
      <p>本次将处理 {count} 个审核项目，结果会写入审核历史。</p>
      <label className="form-field"><span>{rejecting ? '拒绝原因（必填）' : '审核备注（选填）'}</span><textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={rejecting ? '说明拒绝原因，便于商家修改' : '可填写本次审核说明'} /></label>
      <div className="dialog-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={pending}>取消</button><button className={rejecting ? 'danger-button' : 'primary-button'} type="button" disabled={pending || (rejecting && !reason.trim())} onClick={() => onConfirm(reason.trim())}>{pending ? '处理中...' : rejecting ? '确认拒绝' : '确认通过'}</button></div>
    </div>
  </div>
}

export function AuditCenterPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('queue')
  const [type, setType] = useState<AuditType | ''>('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [notice, setNotice] = useState('')

  const queue = useQuery({ queryKey: ['audit-queue', type, keyword, page], queryFn: () => adminApi.audits({ type, keyword, page, size: PAGE_SIZE }), enabled: view === 'queue' })
  const history = useQuery({ queryKey: ['audit-history', type, page], queryFn: () => adminApi.auditHistory({ type, page, size: PAGE_SIZE }), enabled: view === 'history' })
  const mutation = useMutation({
    mutationFn: ({ nextAction, reason }: { nextAction: 'approve' | 'reject', reason: string }) => {
      const selectedItems = queue.data?.list.filter((item) => selected.includes(`${item.type}:${item.id}`)) ?? []
      const grouped = new Map<AuditType, number[]>()
      selectedItems.forEach((item) => grouped.set(item.type, [...(grouped.get(item.type) ?? []), item.id]))
      return Promise.all([...grouped].map(([itemType, ids]) => adminApi.batchAudit(itemType, ids, nextAction, reason)))
    },
    onSuccess: (_, variables) => {
      setNotice(`已${variables.nextAction === 'approve' ? '通过' : '拒绝'} ${selected.length} 个项目`)
      setSelected([])
      setAction(null)
      queryClient.invalidateQueries({ queryKey: ['audit-queue'] })
      queryClient.invalidateQueries({ queryKey: ['audit-history'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const data = view === 'queue' ? queue.data : history.data
  const loading = view === 'queue' ? queue.isLoading : history.isLoading
  const error = view === 'queue' ? queue.error : history.error
  const rows = data?.list ?? []
  const allSelected = view === 'queue' && rows.length > 0 && rows.every((item) => 'type' in item && selected.includes(`${item.type}:${item.id}`))

  return <div className="page-stack">
    <PageTitle title="审核中心" description="集中处理商品和店铺入驻审核，保留完整操作记录" actions={<span className="summary-label"><ClipboardCheck />待处理 {queue.data?.total ?? 0}</span>} />
    <div className="page-switch-row"><Tabs value={view} onChange={(next) => { setView(next); setPage(1); setSelected([]) }} options={[{ value: 'queue', label: '待审核队列', count: queue.data?.total }, { value: 'history', label: '审核历史' }]} /><select aria-label="按审核类型筛选" value={type} onChange={(event) => { setType(event.target.value as AuditType | ''); setPage(1); setSelected([]) }}><option value="">全部类型</option><option value="product">商品</option><option value="shop">店铺</option></select></div>
    {notice && <div className="feedback-banner" role="status"><ClipboardCheck />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}
    {view === 'queue' && <SelectionBar count={selected.length} onClear={() => setSelected([])}><button className="primary-button" type="button" onClick={() => setAction('approve')}><Check />批量通过</button><button className="danger-button" type="button" onClick={() => setAction('reject')}><X />批量拒绝</button></SelectionBar>}
    <section className="content-section table-section">
      {view === 'queue' && <div className="table-toolbar"><div className="search-box"><Search /><input aria-label="搜索审核项目" placeholder="搜索商品或店铺名称" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }} /></div><span className="read-only-note">拒绝操作必须填写原因</span></div>}
      {loading ? <StatePanel type="loading" /> : error ? <StatePanel type="error" message={error.message} onRetry={() => view === 'queue' ? queue.refetch() : history.refetch()} /> : !rows.length ? <StatePanel type="empty" message={view === 'queue' ? '当前没有待审核项目' : '暂无审核记录'} /> : view === 'queue' ? <>
        <div className="table-scroll"><table className="data-table"><thead><tr><th className="check-cell"><input type="checkbox" aria-label="选择当前页" checked={allSelected} onChange={(event) => setSelected(event.target.checked ? (queue.data?.list.map((item) => `${item.type}:${item.id}`) ?? []) : [])} /></th><th>审核项目</th><th>类型</th><th>申请方</th><th>提交时间</th><th>状态</th></tr></thead><tbody>{queue.data?.list.map((item) => { const selectionKey = `${item.type}:${item.id}`; return <tr key={selectionKey}><td className="check-cell"><input type="checkbox" aria-label={`选择 ${item.name}`} checked={selected.includes(selectionKey)} onChange={(event) => setSelected(event.target.checked ? [...selected, selectionKey] : selected.filter((key) => key !== selectionKey))} /></td><td><div className="entity-cell">{item.image ? <img src={item.image} alt="" /> : <span className="avatar-fallback">{item.type === 'shop' ? <Store /> : <ClipboardCheck />}</span>}<div><strong>{item.name}</strong><span>{item.description || `ID ${item.id}`}</span></div></div></td><td>{item.type === 'product' ? '商品' : '店铺'}</td><td>{item.owner || '-'}</td><td>{shortDateTime(item.createTime)}</td><td><StatusBadge tone="warning">待审核</StatusBadge></td></tr> })}</tbody></table></div>
        <Pagination page={page} size={PAGE_SIZE} total={queue.data?.total ?? 0} onChange={setPage} />
      </> : <>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>审核项目</th><th>类型</th><th>结果</th><th>原因/备注</th><th>操作人</th><th>时间</th></tr></thead><tbody>{history.data?.list.map((record) => { const presentation = auditActionPresentation(record.action); return <tr key={record.id}><td><div className="stacked-cell"><strong>{record.bizName}</strong><span>ID {record.bizId}</span></div></td><td>{record.bizType === 'product' ? '商品' : '店铺'}</td><td><StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge></td><td>{record.reason || '-'}</td><td>{record.operatorName}</td><td>{shortDateTime(record.createTime)}</td></tr> })}</tbody></table></div>
        <Pagination page={page} size={PAGE_SIZE} total={history.data?.total ?? 0} onChange={setPage} />
      </>}
    </section>
    <AuditActionDialog open={Boolean(action)} count={selected.length} action={action || 'approve'} pending={mutation.isPending} onCancel={() => setAction(null)} onConfirm={(reason) => action && mutation.mutate({ nextAction: action, reason })} />
  </div>
}
