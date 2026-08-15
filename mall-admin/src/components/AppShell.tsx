import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Bell,
  Boxes,
  CircleHelp,
  ClipboardCheck,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  PackageSearch,
  PanelLeftClose,
  ShoppingBag,
  ShieldCheck,
  Store,
  TicketPercent,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { initials } from '../utils/format'

const navItems = [
  { to: '/', label: '经营概览', icon: LayoutDashboard, end: true },
  { to: '/users', label: '用户管理', icon: UsersRound },
  { to: '/products', label: '商品审核', icon: PackageSearch },
  { to: '/orders', label: '订单管理', icon: ShoppingBag },
  { to: '/shops', label: '店铺管理', icon: Store },
  { to: '/coupons', label: '优惠券', icon: TicketPercent },
  { to: '/audits', label: '审核中心', icon: ClipboardCheck },
  { to: '/catalog', label: '目录配置', icon: ListTree },
  { to: '/security', label: '安全中心', icon: ShieldCheck },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="admin-canvas">
      <div className="admin-shell">
        {menuOpen && <button className="sidebar-scrim" aria-label="关闭导航" onClick={() => setMenuOpen(false)} />}
        <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"><Boxes /></div>
            <div><strong>知遇商城</strong><span>ADMIN</span></div>
            <button className="icon-button sidebar-close" type="button" title="关闭导航" aria-label="关闭导航" onClick={() => setMenuOpen(false)}><PanelLeftClose /></button>
          </div>

          <nav className="main-nav" aria-label="后台主导航">
            <span className="nav-label">工作台</span>
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Icon /><span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <a className="nav-item" href="http://49.235.130.42:8080/doc.html" target="_blank" rel="noreferrer"><CircleHelp /><span>接口文档</span></a>
            <button className="nav-item logout-button" type="button" onClick={logout}><LogOut /><span>退出登录</span></button>
          </div>
        </aside>

        <main className="workspace">
          <header className="workspace-bar">
            <button className="icon-button mobile-menu" type="button" title="打开导航" aria-label="打开导航" onClick={() => setMenuOpen(true)}><Menu /></button>
            <div className="workspace-date">
              <span>{new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</span>
              <small>数据中心</small>
            </div>
            <div className="workspace-profile">
              <button className="icon-button" type="button" title="通知" aria-label="通知"><Bell /></button>
              <div className="profile-copy"><strong>{user?.nickname || '管理员'}</strong><span>平台管理员</span></div>
              {user?.avatar ? <img src={user.avatar} alt="管理员头像" /> : <span className="avatar-fallback">{initials(user?.nickname)}</span>}
            </div>
          </header>
          <div className="workspace-content"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
