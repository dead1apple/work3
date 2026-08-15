import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AppShell } from './components/AppShell'
import { StatePanel } from './components/StatePanel'

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then((module) => ({ default: module.UsersPage })))
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((module) => ({ default: module.OrdersPage })))
const ShopsPage = lazy(() => import('./pages/ShopsPage').then((module) => ({ default: module.ShopsPage })))
const ShopMapPage = lazy(() => import('./pages/ShopMapPage').then((module) => ({ default: module.ShopMapPage })))
const CouponsPage = lazy(() => import('./pages/CouponsPage').then((module) => ({ default: module.CouponsPage })))
const AuditCenterPage = lazy(() => import('./pages/AuditCenterPage').then((module) => ({ default: module.AuditCenterPage })))
const CatalogPage = lazy(() => import('./pages/CatalogPage').then((module) => ({ default: module.CatalogPage })))
const SecurityPage = lazy(() => import('./pages/SecurityPage').then((module) => ({ default: module.SecurityPage })))

function ProtectedShell() {
  const { authenticated } = useAuth()
  const location = useLocation()
  return authenticated ? <AppShell /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

export default function App() {
  return (
    <Suspense fallback={<StatePanel type="loading" message="正在进入管理台" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="shops" element={<ShopsPage />} />
          <Route path="shop-map" element={<ShopMapPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="audits" element={<AuditCenterPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="security" element={<SecurityPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
