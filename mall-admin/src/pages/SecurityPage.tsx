import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, KeyRound, Pencil, Plus, Save, Search, ShieldCheck } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { AdminRole } from '../api/types'
import { Drawer } from '../components/Drawer'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { Tabs } from '../components/Tabs'
import { initials, shortDateTime } from '../utils/format'
import { permissionGroups } from '../utils/permissions'

const PAGE_SIZE = 10
type SecurityView = 'roles' | 'admins' | 'operations' | 'logins' | 'risks'

function RoleEditor({ role, pending, error, onSubmit }: { role: AdminRole | null, pending: boolean, error?: string, onSubmit: (value: Omit<AdminRole, 'id'>) => void }) {
  const [name, setName] = useState(role?.name || '')
  const [code, setCode] = useState(role?.code || '')
  const [permissions, setPermissions] = useState(role?.permissions || [])
  const [status, setStatus] = useState(role?.status ?? 1)
  const togglePermission = (permission: string) => setPermissions((current) => current.includes(permission) ? current.filter((value) => value !== permission) : [...current, permission])
  return <form id="role-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ name: name.trim(), code: code.trim().toUpperCase(), permissions, status }) }}><div className="form-grid"><label className="form-field"><span>角色名称</span><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><label className="form-field"><span>角色编码</span><input required value={code} onChange={(event) => setCode(event.target.value)} disabled={role?.code === 'SUPER_ADMIN'} placeholder="例如 OPERATIONS" /></label><label className="form-field"><span>状态</span><select value={status} onChange={(event) => setStatus(Number(event.target.value))} disabled={role?.code === 'SUPER_ADMIN'}><option value={1}>启用</option><option value={0}>停用</option></select></label></div><section className="permission-section"><h3>模块权限</h3><div className="permission-grid">{permissionGroups.map((group) => <div className="permission-row" key={group.module}><strong>{group.label}</strong><label><input type="checkbox" checked={permissions.includes(`${group.module}:view`)} onChange={() => togglePermission(`${group.module}:view`)} />查看</label><label><input type="checkbox" checked={permissions.includes(`${group.module}:manage`)} onChange={() => togglePermission(`${group.module}:manage`)} />管理</label></div>)}</div></section>{error && <div className="form-error" role="alert">{error}</div>}<input className="sr-only" type="submit" disabled={pending || !name.trim() || !code.trim()} /></form>
}

export function SecurityPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<SecurityView>('roles')
  const [roleEditor, setRoleEditor] = useState<AdminRole | null | undefined>(undefined)
  const [operationKeyword, setOperationKeyword] = useState('')
  const deferredOperationKeyword = useDeferredValue(operationKeyword)
  const [operationPage, setOperationPage] = useState(1)
  const [loginKeyword, setLoginKeyword] = useState('')
  const deferredLoginKeyword = useDeferredValue(loginKeyword)
  const [loginSuccess, setLoginSuccess] = useState<boolean | ''>('')
  const [loginPage, setLoginPage] = useState(1)
  const [notice, setNotice] = useState('')
  const roles = useQuery({ queryKey: ['security-roles'], queryFn: adminApi.roles })
  const admins = useQuery({ queryKey: ['security-admins'], queryFn: adminApi.adminAccounts })
  const operations = useQuery({ queryKey: ['operation-logs', deferredOperationKeyword, operationPage], queryFn: () => adminApi.operationLogs({ keyword: deferredOperationKeyword, page: operationPage, size: PAGE_SIZE }), enabled: view === 'operations' })
  const logins = useQuery({ queryKey: ['login-logs', deferredLoginKeyword, loginSuccess, loginPage], queryFn: () => adminApi.loginLogs({ keyword: deferredLoginKeyword, success: loginSuccess, page: loginPage, size: PAGE_SIZE }), enabled: view === 'logins' })
  const risks = useQuery({ queryKey: ['security-risks'], queryFn: adminApi.risks, enabled: view === 'risks' })
  const roleMutation = useMutation({ mutationFn: (value: Omit<AdminRole, 'id'>) => roleEditor ? adminApi.updateRole(roleEditor.id, value) : adminApi.createRole(value), onSuccess: () => { setNotice(roleEditor ? '角色已更新' : '角色已创建'); setRoleEditor(undefined); queryClient.invalidateQueries({ queryKey: ['security-roles'] }); queryClient.invalidateQueries({ queryKey: ['security-admins'] }) } })
  const assignmentMutation = useMutation({ mutationFn: ({ userId, roleId }: { userId: number, roleId: number }) => adminApi.assignAdminRole(userId, roleId), onSuccess: () => { setNotice('管理员角色已更新'); queryClient.invalidateQueries({ queryKey: ['security-admins'] }) } })

  const tabs = [
    { value: 'roles' as const, label: '角色权限', count: roles.data?.length },
    { value: 'admins' as const, label: '管理员', count: admins.data?.length },
    { value: 'operations' as const, label: '操作日志' },
    { value: 'logins' as const, label: '登录日志' },
    { value: 'risks' as const, label: '风险提示', count: risks.data?.length },
  ]

  return <div className="page-stack">
    <PageTitle title="安全中心" description="管理后台角色分工并查看平台活动记录" actions={view === 'roles' ? <button className="primary-button" type="button" onClick={() => { setRoleEditor(null); roleMutation.reset() }}><Plus />新建角色</button> : <span className="summary-label"><ShieldCheck />后台活动</span>} />
    <Tabs value={view} options={tabs} onChange={setView} />
    {notice && <div className="feedback-banner" role="status"><ShieldCheck />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}

    {view === 'roles' && <section className="content-section table-section">{roles.isLoading ? <StatePanel type="loading" /> : roles.isError ? <StatePanel type="error" message={roles.error.message} onRetry={() => roles.refetch()} /> : !roles.data?.length ? <StatePanel type="empty" /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>角色</th><th>权限</th><th>状态</th><th>创建时间</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{roles.data.map((role) => <tr key={role.id}><td><div className="entity-cell"><span className="avatar-fallback"><KeyRound /></span><div><strong>{role.name}</strong><span>{role.code} · ID {role.id}</span></div></div></td><td><div className="permission-tags">{role.permissions.includes('*') ? <span>全部权限</span> : role.permissions.slice(0, 4).map((permission) => <span key={permission}>{permission}</span>)}{role.permissions.length > 4 && <small>+{role.permissions.length - 4}</small>}</div></td><td><StatusBadge tone={role.status === 1 ? 'success' : 'muted'}>{role.status === 1 ? '启用' : '停用'}</StatusBadge></td><td>{shortDateTime(role.createTime)}</td><td className="action-cell"><button className="icon-button" type="button" title="编辑角色" aria-label={`编辑 ${role.name}`} onClick={() => { setRoleEditor(role); roleMutation.reset() }}><Pencil /></button></td></tr>)}</tbody></table></div>}</section>}

    {view === 'admins' && <section className="content-section table-section">{admins.isLoading ? <StatePanel type="loading" /> : admins.isError ? <StatePanel type="error" message={admins.error.message} onRetry={() => admins.refetch()} /> : !admins.data?.length ? <StatePanel type="empty" /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>管理员</th><th>联系方式</th><th>当前角色</th><th>账号状态</th><th>最近登录</th></tr></thead><tbody>{admins.data.map((admin) => <tr key={admin.id}><td><div className="entity-cell">{admin.avatar ? <img src={admin.avatar} alt="" /> : <span className="avatar-fallback">{initials(admin.nickname)}</span>}<div><strong>{admin.nickname || admin.username}</strong><span>@{admin.username} · ID {admin.id}</span></div></div></td><td>{admin.phone || admin.email || '-'}</td><td><select aria-label={`设置 ${admin.username} 的角色`} value={admin.roleId || ''} disabled={assignmentMutation.isPending} onChange={(event) => assignmentMutation.mutate({ userId: admin.id, roleId: Number(event.target.value) })}><option value="" disabled>选择角色</option>{roles.data?.filter((role) => role.status === 1).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></td><td><StatusBadge tone={admin.status === 1 ? 'success' : 'muted'}>{admin.status === 1 ? '正常' : '停用'}</StatusBadge></td><td>{shortDateTime(admin.lastLoginTime)}</td></tr>)}</tbody></table></div>}</section>}

    {view === 'operations' && <section className="content-section table-section"><div className="table-toolbar"><div className="search-box"><Search /><input aria-label="搜索操作日志" placeholder="搜索管理员、模块或操作" value={operationKeyword} onChange={(event) => { setOperationKeyword(event.target.value); setOperationPage(1) }} /></div></div>{operations.isLoading ? <StatePanel type="loading" /> : operations.isError ? <StatePanel type="error" message={operations.error.message} onRetry={() => operations.refetch()} /> : !operations.data?.list.length ? <StatePanel type="empty" /> : <><div className="table-scroll"><table className="data-table"><thead><tr><th>管理员</th><th>模块</th><th>操作</th><th>目标</th><th>结果</th><th>IP</th><th>时间</th></tr></thead><tbody>{operations.data.list.map((log) => <tr key={log.id}><td>{log.adminName}</td><td>{log.module}</td><td>{log.action}</td><td><div className="stacked-cell"><strong>{log.targetType || '-'}</strong><span>{log.targetId || log.detail || '-'}</span></div></td><td><StatusBadge tone={log.success ? 'success' : 'danger'}>{log.success ? '成功' : '失败'}</StatusBadge></td><td>{log.ip || '-'}</td><td>{shortDateTime(log.createTime)}</td></tr>)}</tbody></table></div><Pagination page={operationPage} size={PAGE_SIZE} total={operations.data.total} onChange={setOperationPage} /></>}</section>}

    {view === 'logins' && <section className="content-section table-section"><div className="table-toolbar"><div className="search-box"><Search /><input aria-label="搜索登录日志" placeholder="搜索账号或 IP" value={loginKeyword} onChange={(event) => { setLoginKeyword(event.target.value); setLoginPage(1) }} /></div><select aria-label="按登录结果筛选" value={loginSuccess === '' ? '' : String(loginSuccess)} onChange={(event) => { setLoginSuccess(event.target.value === '' ? '' : event.target.value === 'true'); setLoginPage(1) }}><option value="">全部结果</option><option value="true">成功</option><option value="false">失败</option></select></div>{logins.isLoading ? <StatePanel type="loading" /> : logins.isError ? <StatePanel type="error" message={logins.error.message} onRetry={() => logins.refetch()} /> : !logins.data?.list.length ? <StatePanel type="empty" /> : <><div className="table-scroll"><table className="data-table"><thead><tr><th>账号</th><th>结果</th><th>说明</th><th>IP</th><th>时间</th></tr></thead><tbody>{logins.data.list.map((log) => <tr key={log.id}><td><div className="stacked-cell"><strong>{log.username}</strong><span>用户 ID {log.userId || '-'}</span></div></td><td><StatusBadge tone={log.success ? 'success' : 'danger'}>{log.success ? '成功' : '失败'}</StatusBadge></td><td>{log.message || '-'}</td><td>{log.ip || '-'}</td><td>{shortDateTime(log.createTime)}</td></tr>)}</tbody></table></div><Pagination page={loginPage} size={PAGE_SIZE} total={logins.data.total} onChange={setLoginPage} /></>}</section>}

    {view === 'risks' && (risks.isLoading ? <StatePanel type="loading" /> : risks.isError ? <StatePanel type="error" message={risks.error.message} onRetry={() => risks.refetch()} /> : !risks.data?.length ? <StatePanel type="empty" message="当前没有风险提示" /> : <section className="risk-list">{risks.data.map((risk) => <article className="risk-row" key={risk.id}><span className={`risk-icon risk-${risk.level}`}><AlertTriangle /></span><div><div><strong>{risk.title}</strong><StatusBadge tone={risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'info'}>{risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}</StatusBadge></div><p>{risk.description}</p><small>{risk.username ? `账号 ${risk.username}` : risk.type}{risk.count ? ` · ${risk.count} 次` : ''}{risk.lastSeen ? ` · 最近 ${shortDateTime(risk.lastSeen)}` : ''}</small></div></article>)}</section>)}

    <Drawer open={roleEditor !== undefined} title={roleEditor ? '编辑角色' : '新建角色'} subtitle={roleEditor ? roleEditor.code : '定义后台工作权限'} width="wide" onClose={() => setRoleEditor(undefined)} footer={<><button className="secondary-button" onClick={() => setRoleEditor(undefined)}>取消</button><button className="primary-button" type="submit" form="role-form" disabled={roleMutation.isPending}><Save />保存角色</button></>}>{roleEditor !== undefined && <RoleEditor key={roleEditor?.id || 'new'} role={roleEditor} pending={roleMutation.isPending} error={roleMutation.error?.message} onSubmit={(value) => roleMutation.mutate(value)} />}</Drawer>
  </div>
}
