import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Store,
  UsersRound,
} from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { adminApi } from '../api/admin'
import { PageTitle } from '../components/PageTitle'
import { StatePanel } from '../components/StatePanel'
import { compactNumber, currency, orderStatusNames } from '../utils/format'

const periods = [7, 30, 90] as const
const stateColors = ['#f1a34f', '#67ace5', '#64bca4', '#4f8d7c', '#a5a9b0', '#ed7181']

export function DashboardPage() {
  const [days, setDays] = useState<(typeof periods)[number]>(30)
  const query = useQuery({ queryKey: ['admin-dashboard', days], queryFn: () => adminApi.dashboard(days) })

  if (query.isLoading) return <StatePanel type="loading" message="正在汇总平台经营数据" />
  if (query.isError || !query.data) return <StatePanel type="error" message={query.error?.message} onRetry={() => query.refetch()} />

  const overview = query.data
  const { metrics, pending } = overview
  const metricsView = [
    { label: '成交金额', value: currency(metrics.revenue), note: `${metrics.paidOrderCount} 笔已支付订单`, icon: CircleDollarSign, tone: 'orange' },
    { label: '平台用户', value: compactNumber(metrics.userCount), note: `${metrics.activeUserCount} 个正常账号`, icon: UsersRound, tone: 'blue' },
    { label: '在售商品', value: compactNumber(metrics.activeProductCount), note: `共 ${metrics.productCount} 件商品`, icon: PackageCheck, tone: 'green' },
    { label: '订单完成率', value: `${metrics.completionRate}%`, note: `券核销 ${metrics.couponUsageRate}%`, icon: ClipboardCheck, tone: 'rose' },
  ]
  const totalStates = overview.orderStates.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="page-stack">
      <PageTitle
        title="经营概览"
        description={`近 ${overview.days} 天平台经营数据与待处理事项`}
        actions={<div className="dashboard-actions"><div className="period-control" aria-label="统计周期">{periods.map((period) => <button key={period} type="button" className={days === period ? 'active' : ''} aria-pressed={days === period} onClick={() => setDays(period)}>{period} 天</button>)}</div><button className="icon-button" type="button" title="刷新数据" aria-label="刷新数据" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? 'spin' : ''} /></button></div>}
      />

      <section className="metric-strip" aria-label="核心经营指标">
        {metricsView.map(({ label, value, note, icon: Icon, tone }) => (
          <article className="metric-item" key={label}>
            <span className={`metric-icon metric-${tone}`}><Icon /></span>
            <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
          </article>
        ))}
      </section>

      <section className="content-section chart-section">
        <div className="section-heading"><div><h2>交易趋势</h2><p>成交金额与订单量按日汇总</p></div><span className="summary-label"><ReceiptText />{metrics.orderCount} 笔订单</span></div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={overview.trend} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#76b8ee" stopOpacity={0.28} /><stop offset="100%" stopColor="#76b8ee" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="#eceef1" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8e929a', fontSize: 11 }} dy={10} />
              <YAxis yAxisId="money" axisLine={false} tickLine={false} tick={{ fill: '#8e929a', fontSize: 11 }} tickFormatter={(value) => `¥${compactNumber(Number(value))}`} width={64} />
              <YAxis yAxisId="orders" orientation="right" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#8e929a', fontSize: 11 }} width={32} />
              <Tooltip formatter={(value, name) => name === 'revenue' ? [currency(Number(value)), '成交金额'] : [Number(value), '订单量']} labelFormatter={(value) => `${value}`} contentStyle={{ border: 0, borderRadius: 6, background: '#101a2e', color: '#fff', boxShadow: '0 10px 30px rgba(16,26,46,.18)' }} />
              <Area yAxisId="money" type="monotone" dataKey="revenue" stroke="#65a9e4" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5, fill: '#65a9e4', stroke: '#fff', strokeWidth: 3 }} />
              <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#f1a34f" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="dashboard-split">
        <section className="content-section">
          <div className="section-heading"><div><h2>订单状态分布</h2><p>当前周期内各状态订单数量</p></div><ReceiptText /></div>
          <div className="distribution-list">{overview.orderStates.map((item, index) => <div className="distribution-row" key={item.status}><span>{orderStatusNames[item.status] || `状态 ${item.status}`}</span><div><i style={{ width: `${totalStates ? item.count / totalStates * 100 : 0}%`, background: stateColors[index % stateColors.length] }} /></div><strong>{item.count}</strong></div>)}</div>
        </section>
        <section className="content-section pending-section">
          <div className="section-heading"><div><h2>待处理事项</h2><p>审核及退款工作量</p></div><BadgeCheck /></div>
          <div className="pending-list">
            <div><span className="review-icon review-product"><PackageCheck /></span><p><strong>{pending.products}</strong><span>待审商品</span></p></div>
            <div><span className="review-icon review-shop"><Store /></span><p><strong>{pending.shops}</strong><span>待审店铺</span></p></div>
            <div><span className="review-icon metric-rose"><ReceiptText /></span><p><strong>{pending.refunds}</strong><span>待处理退款</span></p></div>
          </div>
          <div className="pending-total"><span>待处理合计</span><strong>{metrics.pendingAuditCount + pending.refunds}</strong></div>
        </section>
      </div>

      <div className="ranking-grid">
        <section className="content-section ranking-section">
          <div className="section-heading"><div><h2>热销商品</h2><p>按销量排名</p></div><PackageCheck /></div>
          <div className="ranking-list">{overview.topProducts.map((item, index) => <div className="ranking-row" key={item.id}><b>{index + 1}</b>{item.image ? <img src={item.image} alt="" /> : <span className="ranking-placeholder"><PackageCheck /></span>}<div><strong>{item.name}</strong><span>销售额 {currency(item.secondary || 0)}</span></div><em>{compactNumber(item.value)}</em></div>)}</div>
        </section>
        <section className="content-section ranking-section">
          <div className="section-heading"><div><h2>活跃店铺</h2><p>按成交金额排名</p></div><Store /></div>
          <div className="ranking-list">{overview.topShops.map((item, index) => <div className="ranking-row" key={item.id}><b>{index + 1}</b>{item.image ? <img src={item.image} alt="" /> : <span className="ranking-placeholder"><Store /></span>}<div><strong>{item.name}</strong><span>{compactNumber(item.secondary || 0)} 笔订单</span></div><em>{currency(item.value)}</em></div>)}</div>
        </section>
      </div>
    </div>
  )
}
