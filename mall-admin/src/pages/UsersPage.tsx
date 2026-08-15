import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, MapPin, Power, ReceiptText, Search, ShieldCheck, TicketPercent, UserCheck, UserX } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { AdminUser } from '../api/types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Drawer } from '../components/Drawer'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { currency, initials, orderStatusNames, roleNames, shortDateTime, statusTone } from '../utils/format'

const PAGE_SIZE = 8

export function UsersPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const [role, setRole] = useState<number | ''>('')
  const [status, setStatus] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  const query = useQuery({
    queryKey: ['users', deferredKeyword, role, status, page],
    queryFn: () => adminApi.users({ keyword: deferredKeyword, role, status, page, size: PAGE_SIZE }),
  })
  const detailQuery = useQuery({
    queryKey: ['user-detail', detailId],
    queryFn: () => adminApi.userDetail(detailId!),
    enabled: detailId != null,
  })
  const mutation = useMutation({
    mutationFn: (user: AdminUser) => adminApi.setUserStatus(user.id, user.status === 1 ? 0 : 1),
    onSuccess: (_, user) => {
      setNotice(`${user.nickname || user.username} 已${user.status === 1 ? '停用' : '启用'}`)
      setTarget(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-snapshot'] })
    },
  })

  const updateFilter = (setter: (value: never) => void, value: number | '') => {
    setter(value as never)
    setPage(1)
  }

  return (
    <div className="page-stack">
      <PageTitle title="用户管理" description="查看平台账号并控制用户访问状态" actions={<span className="summary-label"><ShieldCheck />正常账号 {query.data?.list.filter((user) => user.status === 1).length ?? 0}</span>} />
      {notice && <div className="feedback-banner" role="status"><UserCheck />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}
      <section className="content-section table-section">
        <div className="table-toolbar">
          <div className="search-box"><Search /><input aria-label="搜索用户" placeholder="搜索用户名或昵称" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }} /></div>
          <div className="filter-group">
            <select aria-label="按角色筛选" value={role} onChange={(event) => updateFilter(setRole as never, event.target.value === '' ? '' : Number(event.target.value))}><option value="">全部角色</option><option value="0">普通用户</option><option value="1">商家</option><option value="2">管理员</option></select>
            <select aria-label="按状态筛选" value={status} onChange={(event) => updateFilter(setStatus as never, event.target.value === '' ? '' : Number(event.target.value))}><option value="">全部状态</option><option value="1">正常</option><option value="0">已停用</option></select>
          </div>
        </div>

        {query.isLoading ? <StatePanel type="loading" /> : query.isError ? <StatePanel type="error" message={query.error.message} onRetry={() => query.refetch()} /> : !query.data?.list.length ? <StatePanel type="empty" /> : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>用户</th><th>联系方式</th><th>角色</th><th>账号状态</th><th>最近登录</th><th><span className="sr-only">操作</span></th></tr></thead>
                <tbody>{query.data.list.map((user) => (
                  <tr key={user.id}>
                    <td><div className="entity-cell">{user.avatar ? <img src={user.avatar} alt="" /> : <span className="avatar-fallback">{initials(user.nickname)}</span>}<div><strong>{user.nickname || user.username}</strong><span>@{user.username} · ID {user.id}</span></div></div></td>
                    <td><div className="stacked-cell"><strong>{user.phone || '-'}</strong><span>{user.email || '-'}</span></div></td>
                    <td>{roleNames[user.role] || '未知'}</td>
                    <td><StatusBadge tone={statusTone(user.status, 'user')}>{user.status === 1 ? '正常' : '已停用'}</StatusBadge></td>
                    <td>{shortDateTime(user.lastLoginTime)}</td>
                    <td className="action-cell"><div className="row-actions"><button className="icon-button" type="button" title="查看详情" aria-label={`查看 ${user.username}`} onClick={() => setDetailId(user.id)}><Eye /></button>{user.role !== 2 && <button className={`icon-button ${user.status === 1 ? 'action-danger' : 'action-success'}`} type="button" title={user.status === 1 ? '停用账号' : '启用账号'} aria-label={user.status === 1 ? `停用 ${user.username}` : `启用 ${user.username}`} onClick={() => setTarget(user)}>{user.status === 1 ? <UserX /> : <Power />}</button>}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination page={page} size={PAGE_SIZE} total={query.data.total} onChange={setPage} />
          </>
        )}
      </section>
      <Drawer open={detailId != null} title={detailQuery.data?.user.nickname || detailQuery.data?.user.username || '用户详情'} subtitle={detailQuery.data ? `@${detailQuery.data.user.username} · ID ${detailQuery.data.user.id}` : '正在加载用户资料'} width="wide" onClose={() => setDetailId(null)}>
        {detailQuery.isLoading ? <StatePanel type="loading" /> : detailQuery.isError || !detailQuery.data ? <StatePanel type="error" message={detailQuery.error?.message} onRetry={() => detailQuery.refetch()} /> : <>
          <section className="detail-block"><h3>账号资料</h3><div className="definition-grid"><div><span>手机号</span><strong>{detailQuery.data.user.phone || '-'}</strong></div><div><span>邮箱</span><strong>{detailQuery.data.user.email || '-'}</strong></div><div><span>角色</span><strong>{roleNames[detailQuery.data.user.role] || '未知'}</strong></div><div><span>最近登录</span><strong>{shortDateTime(detailQuery.data.user.lastLoginTime)}</strong></div><div><span>登录 IP</span><strong>{detailQuery.data.user.lastLoginIp || '-'}</strong></div><div><span>注册时间</span><strong>{shortDateTime(detailQuery.data.user.createTime)}</strong></div></div></section>
          <section className="detail-block"><h3><MapPin />收货地址 · {detailQuery.data.addresses.length}</h3><div className="mini-list">{detailQuery.data.addresses.length ? detailQuery.data.addresses.map((address) => <div className="mini-list-row" key={address.id}><MapPin /><div><strong>{address.receiverName} · {address.receiverPhone}{address.isDefault === 1 ? ' · 默认' : ''}</strong><span>{address.province}{address.city}{address.district}{address.detailAddress}</span></div></div>) : <p className="empty-inline">暂无收货地址</p>}</div></section>
          <section className="detail-block"><h3><ReceiptText />最近订单 · {detailQuery.data.orders.length}</h3><div className="mini-list">{detailQuery.data.orders.length ? detailQuery.data.orders.map((order) => <div className="mini-list-row" key={order.id}><ReceiptText /><div><strong>{order.orderNo}</strong><span>{shortDateTime(order.createTime)} · {orderStatusNames[order.status]}</span></div><b>{currency(order.payAmount)}</b></div>) : <p className="empty-inline">暂无订单</p>}</div></section>
          <section className="detail-block"><h3><TicketPercent />已领优惠券 · {detailQuery.data.coupons.length}</h3><div className="mini-list">{detailQuery.data.coupons.length ? detailQuery.data.coupons.map((coupon) => <div className="mini-list-row" key={coupon.userCouponId || coupon.id}><TicketPercent /><div><strong>{coupon.name}</strong><span>{coupon.userStatus === 1 ? '已使用' : coupon.userStatus === 2 ? '已过期' : '未使用'} · {shortDateTime(coupon.receiveTime)}</span></div><b>{currency(coupon.amount)}</b></div>) : <p className="empty-inline">暂无领券记录</p>}</div></section>
          <section className="detail-block"><h3>登录记录 · {detailQuery.data.loginLogs.length}</h3><div className="mini-list">{detailQuery.data.loginLogs.map((log) => <div className="mini-list-row" key={log.id}><ShieldCheck /><div><strong>{log.success ? '登录成功' : '登录失败'} · {log.ip || '-'}</strong><span>{shortDateTime(log.createTime)}{log.message ? ` · ${log.message}` : ''}</span></div></div>)}</div></section>
        </>}
      </Drawer>
      <ConfirmDialog open={Boolean(target)} title={target?.status === 1 ? '停用这个账号？' : '重新启用账号？'} description={target ? `${target.nickname || target.username} ${target.status === 1 ? '将无法继续登录和使用商城服务。' : '将恢复登录和商城访问权限。'}` : ''} confirmText={target?.status === 1 ? '确认停用' : '确认启用'} tone={target?.status === 1 ? 'danger' : 'primary'} pending={mutation.isPending} onCancel={() => setTarget(null)} onConfirm={() => target && mutation.mutate(target)} />
    </div>
  )
}
