import { useState } from 'react'
import { ArrowRight, Boxes, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { authenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (authenticated) return <Navigate to="/" replace />

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await login(username.trim(), password)
      const target = (location.state as { from?: string } | null)?.from || '/'
      navigate(target, { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败，请稍后重试')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand"><span className="brand-mark"><Boxes /></span><strong>知遇商城</strong></div>
        <div className="login-message">
          <span className="login-kicker">MALL OPERATIONS</span>
          <h1>经营数据，清楚可见。</h1>
          <p>集中查看平台用户、商品、订单与店铺状态，及时完成风险处置和审核工作。</p>
        </div>
        <div className="login-signal"><span className="signal-dot" />后台服务运行正常</div>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={submit}>
          <div className="login-form-heading"><span>管理员入口</span><h2>欢迎回来</h2><p>使用管理员账号登录管理后台</p></div>
          <label className="field-label" htmlFor="username">账号</label>
          <div className="input-shell"><UserRound /><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></div>
          <label className="field-label" htmlFor="password">密码</label>
          <div className="input-shell"><LockKeyhole /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button type="button" className="input-icon" aria-label={showPassword ? '隐藏密码' : '显示密码'} title={showPassword ? '隐藏密码' : '显示密码'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="login-submit" disabled={pending} type="submit"><span>{pending ? '正在验证...' : '进入管理后台'}</span><ArrowRight /></button>
          <div className="login-demo"><span>测试账号</span><code>admin</code><i>/</i><code>123456</code></div>
        </form>
      </section>
    </div>
  )
}
