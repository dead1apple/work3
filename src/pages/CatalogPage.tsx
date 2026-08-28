import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, Pencil, Plus, Power, Save, Settings2, Tags } from 'lucide-react'
import { adminApi } from '../api/admin'
import type { Brand, Category, SystemConfig } from '../api/types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Drawer } from '../components/Drawer'
import { PageTitle } from '../components/PageTitle'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { Tabs } from '../components/Tabs'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { shortDate } from '../utils/format'

type CatalogView = 'categories' | 'brands' | 'config'
type StatusTarget = { kind: 'category', item: Category } | { kind: 'brand', item: Brand }

function CategoryEditor({ item, pending, error, onSubmit }: { item: Category | null, pending: boolean, error?: string, onSubmit: (form: Omit<Category, 'id'>) => void }) {
  const [name, setName] = useState(item?.name || '')
  const [parentId, setParentId] = useState(String(item?.parentId ?? 0))
  const [level, setLevel] = useState(String(item?.level ?? 1))
  const [icon, setIcon] = useState(item?.icon || '')
  const [sortOrder, setSortOrder] = useState(String(item?.sortOrder ?? 0))
  const [status, setStatus] = useState(item?.status ?? 1)
  return <form id="category-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ name: name.trim(), parentId: Number(parentId), level: Number(level), icon: icon.trim() || undefined, sortOrder: Number(sortOrder), status }) }}><div className="form-grid"><label className="form-field form-span-2"><span>分类名称</span><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><label className="form-field"><span>父分类 ID</span><input required type="number" min="0" value={parentId} onChange={(event) => setParentId(event.target.value)} /></label><label className="form-field"><span>分类层级</span><input required type="number" min="1" value={level} onChange={(event) => setLevel(event.target.value)} /></label><label className="form-field"><span>图标地址</span><input value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="可选" /></label><label className="form-field"><span>排序值</span><input required type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label><label className="form-field"><span>状态</span><select value={status} onChange={(event) => setStatus(Number(event.target.value))}><option value={1}>启用</option><option value={0}>停用</option></select></label></div>{error && <div className="form-error" role="alert">{error}</div>}<input className="sr-only" type="submit" disabled={pending || !name.trim()} /></form>
}

function BrandEditor({ item, pending, error, onSubmit }: { item: Brand | null, pending: boolean, error?: string, onSubmit: (form: Omit<Brand, 'id'>) => void }) {
  const [name, setName] = useState(item?.name || '')
  const [logo, setLogo] = useState(item?.logo || '')
  const [description, setDescription] = useState(item?.description || '')
  const [sortOrder, setSortOrder] = useState(String(item?.sortOrder ?? 0))
  const [status, setStatus] = useState(item?.status ?? 1)
  return <form id="brand-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ name: name.trim(), logo: logo.trim() || undefined, description: description.trim() || undefined, sortOrder: Number(sortOrder), status }) }}><div className="form-grid"><label className="form-field form-span-2"><span>品牌名称</span><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><label className="form-field form-span-2"><span>Logo 地址</span><input value={logo} onChange={(event) => setLogo(event.target.value)} placeholder="可选" /></label><label className="form-field form-span-2"><span>品牌简介</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="form-field"><span>排序值</span><input required type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label><label className="form-field"><span>状态</span><select value={status} onChange={(event) => setStatus(Number(event.target.value))}><option value={1}>启用</option><option value={0}>停用</option></select></label></div>{error && <div className="form-error" role="alert">{error}</div>}<input className="sr-only" type="submit" disabled={pending || !name.trim()} /></form>
}

function ConfigEditor({ config, pending, error, onSubmit }: { config: SystemConfig, pending: boolean, error?: string, onSubmit: (config: SystemConfig) => void }) {
  const [smsMockEnabled, setSmsMockEnabled] = useState(config.smsMockEnabled)
  const [payMockEnabled, setPayMockEnabled] = useState(config.payMockEnabled)
  const [recommended, setRecommended] = useState(config.recommendedProductIds.join(', '))
  const parsedIds = [...new Set(recommended.split(/[\s,，]+/).map(Number).filter((id) => Number.isInteger(id) && id > 0))]
  return <form className="config-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ smsMockEnabled, payMockEnabled, recommendedProductIds: parsedIds }) }}><section className="settings-section"><h2>服务开关</h2><ToggleSwitch checked={smsMockEnabled} label="短信 Mock" description="验证码发送使用本地模拟服务" disabled={pending} onChange={setSmsMockEnabled} /><ToggleSwitch checked={payMockEnabled} label="支付 Mock" description="支付流程使用模拟交易通道" disabled={pending} onChange={setPayMockEnabled} /></section><section className="settings-section"><h2>推荐商品</h2><label className="form-field"><span>推荐商品 ID</span><textarea rows={5} value={recommended} onChange={(event) => setRecommended(event.target.value)} placeholder="使用逗号或空格分隔，例如 12, 35, 48" /></label><p className="field-note">当前有效 ID：{parsedIds.length ? parsedIds.join(', ') : '无'}</p></section>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-button" type="submit" disabled={pending}><Save />{pending ? '保存中' : '保存配置'}</button></form>
}

export function CatalogPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<CatalogView>('categories')
  const [categoryEditor, setCategoryEditor] = useState<Category | null | undefined>(undefined)
  const [brandEditor, setBrandEditor] = useState<Brand | null | undefined>(undefined)
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null)
  const [notice, setNotice] = useState('')
  const categories = useQuery({ queryKey: ['catalog-categories'], queryFn: adminApi.categories })
  const brands = useQuery({ queryKey: ['catalog-brands'], queryFn: adminApi.brands })
  const config = useQuery({ queryKey: ['system-config'], queryFn: adminApi.getConfig })
  const categorySave = useMutation({ mutationFn: async (form: Omit<Category, 'id'>) => { if (categoryEditor) await adminApi.updateCategory(categoryEditor.id, form); else await adminApi.createCategory(form) }, onSuccess: () => { setNotice(categoryEditor ? '分类已更新' : '分类已创建'); setCategoryEditor(undefined); queryClient.invalidateQueries({ queryKey: ['catalog-categories'] }) } })
  const brandSave = useMutation({ mutationFn: async (form: Omit<Brand, 'id'>) => { if (brandEditor) await adminApi.updateBrand(brandEditor.id, form); else await adminApi.createBrand(form) }, onSuccess: () => { setNotice(brandEditor ? '品牌已更新' : '品牌已创建'); setBrandEditor(undefined); queryClient.invalidateQueries({ queryKey: ['catalog-brands'] }) } })
  const statusMutation = useMutation({ mutationFn: (target: StatusTarget) => target.kind === 'category' ? adminApi.setCategoryStatus(target.item.id, target.item.status === 1 ? 0 : 1) : adminApi.setBrandStatus(target.item.id, target.item.status === 1 ? 0 : 1), onSuccess: (_, target) => { setNotice(`${target.item.name} 已${target.item.status === 1 ? '停用' : '启用'}`); setStatusTarget(null); queryClient.invalidateQueries({ queryKey: [target.kind === 'category' ? 'catalog-categories' : 'catalog-brands'] }) } })
  const configMutation = useMutation({ mutationFn: adminApi.updateConfig, onSuccess: (_, next) => { setNotice('系统配置已保存'); queryClient.setQueryData(['system-config'], next) } })
  const categoryNames = new Map((categories.data || []).map((item) => [item.id, item.name]))

  return <div className="page-stack">
    <PageTitle title="目录与配置" description="维护商品目录、品牌与运营环境配置" actions={view === 'categories' ? <button className="primary-button" onClick={() => { setCategoryEditor(null); categorySave.reset() }}><Plus />新建分类</button> : view === 'brands' ? <button className="primary-button" onClick={() => { setBrandEditor(null); brandSave.reset() }}><Plus />新建品牌</button> : <span className="summary-label"><Settings2 />运行配置</span>} />
    <Tabs value={view} onChange={setView} options={[{ value: 'categories', label: '商品分类', count: categories.data?.length }, { value: 'brands', label: '品牌管理', count: brands.data?.length }, { value: 'config', label: '系统配置' }]} />
    {notice && <div className="feedback-banner" role="status"><Settings2 />{notice}<button onClick={() => setNotice('')}>知道了</button></div>}
    {view === 'categories' && <section className="content-section table-section">{categories.isLoading ? <StatePanel type="loading" /> : categories.isError ? <StatePanel type="error" message={categories.error.message} onRetry={() => categories.refetch()} /> : !categories.data?.length ? <StatePanel type="empty" /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>分类</th><th>父分类</th><th>层级</th><th>排序</th><th>状态</th><th>创建时间</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{categories.data.map((item) => <tr key={item.id}><td><div className="entity-cell"><span className="avatar-fallback"><Tags /></span><div><strong>{item.name}</strong><span>分类 ID {item.id}</span></div></div></td><td>{item.parentId ? categoryNames.get(item.parentId) || `#${item.parentId}` : '顶级分类'}</td><td>{item.level}</td><td>{item.sortOrder}</td><td><StatusBadge tone={item.status === 1 ? 'success' : 'muted'}>{item.status === 1 ? '启用' : '停用'}</StatusBadge></td><td>{shortDate(item.createTime)}</td><td className="action-cell"><div className="row-actions"><button className="icon-button" title="编辑分类" aria-label={`编辑 ${item.name}`} onClick={() => { setCategoryEditor(item); categorySave.reset() }}><Pencil /></button><button className={`icon-button ${item.status === 1 ? 'action-danger' : 'action-success'}`} title={item.status === 1 ? '停用分类' : '启用分类'} aria-label={`${item.status === 1 ? '停用' : '启用'} ${item.name}`} onClick={() => setStatusTarget({ kind: 'category', item })}><Power /></button></div></td></tr>)}</tbody></table></div>}</section>}
    {view === 'brands' && <section className="content-section table-section">{brands.isLoading ? <StatePanel type="loading" /> : brands.isError ? <StatePanel type="error" message={brands.error.message} onRetry={() => brands.refetch()} /> : !brands.data?.length ? <StatePanel type="empty" /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>品牌</th><th>简介</th><th>排序</th><th>状态</th><th>创建时间</th><th><span className="sr-only">操作</span></th></tr></thead><tbody>{brands.data.map((item) => <tr key={item.id}><td><div className="entity-cell">{item.logo ? <img src={item.logo} alt="" /> : <span className="avatar-fallback"><Boxes /></span>}<div><strong>{item.name}</strong><span>品牌 ID {item.id}</span></div></div></td><td>{item.description || '-'}</td><td>{item.sortOrder}</td><td><StatusBadge tone={item.status === 1 ? 'success' : 'muted'}>{item.status === 1 ? '启用' : '停用'}</StatusBadge></td><td>{shortDate(item.createTime)}</td><td className="action-cell"><div className="row-actions"><button className="icon-button" title="编辑品牌" aria-label={`编辑 ${item.name}`} onClick={() => { setBrandEditor(item); brandSave.reset() }}><Pencil /></button><button className={`icon-button ${item.status === 1 ? 'action-danger' : 'action-success'}`} title={item.status === 1 ? '停用品牌' : '启用品牌'} aria-label={`${item.status === 1 ? '停用' : '启用'} ${item.name}`} onClick={() => setStatusTarget({ kind: 'brand', item })}><Power /></button></div></td></tr>)}</tbody></table></div>}</section>}
    {view === 'config' && (config.isLoading ? <StatePanel type="loading" /> : config.isError || !config.data ? <StatePanel type="error" message={config.error?.message} onRetry={() => config.refetch()} /> : <ConfigEditor key={JSON.stringify(config.data)} config={config.data} pending={configMutation.isPending} error={configMutation.error?.message} onSubmit={(next) => configMutation.mutate(next)} />)}
    <Drawer open={categoryEditor !== undefined} title={categoryEditor ? '编辑分类' : '新建分类'} subtitle={categoryEditor ? `分类 ID ${categoryEditor.id}` : '添加商品目录节点'} onClose={() => setCategoryEditor(undefined)} footer={<><button className="secondary-button" onClick={() => setCategoryEditor(undefined)}>取消</button><button className="primary-button" type="submit" form="category-form" disabled={categorySave.isPending}><Save />保存分类</button></>}>{categoryEditor !== undefined && <CategoryEditor key={categoryEditor?.id || 'new'} item={categoryEditor} pending={categorySave.isPending} error={categorySave.error?.message} onSubmit={(form) => categorySave.mutate(form)} />}</Drawer>
    <Drawer open={brandEditor !== undefined} title={brandEditor ? '编辑品牌' : '新建品牌'} subtitle={brandEditor ? `品牌 ID ${brandEditor.id}` : '添加商品品牌'} onClose={() => setBrandEditor(undefined)} footer={<><button className="secondary-button" onClick={() => setBrandEditor(undefined)}>取消</button><button className="primary-button" type="submit" form="brand-form" disabled={brandSave.isPending}><Save />保存品牌</button></>}>{brandEditor !== undefined && <BrandEditor key={brandEditor?.id || 'new'} item={brandEditor} pending={brandSave.isPending} error={brandSave.error?.message} onSubmit={(form) => brandSave.mutate(form)} />}</Drawer>
    <ConfirmDialog open={Boolean(statusTarget)} title={`${statusTarget?.item.status === 1 ? '停用' : '启用'}这个${statusTarget?.kind === 'category' ? '分类' : '品牌'}？`} description={statusTarget ? `“${statusTarget.item.name}”的可用状态将立即更新。` : ''} confirmText="确认更新" tone={statusTarget?.item.status === 1 ? 'danger' : 'primary'} pending={statusMutation.isPending} onCancel={() => setStatusTarget(null)} onConfirm={() => statusTarget && statusMutation.mutate(statusTarget)} />
  </div>
}
