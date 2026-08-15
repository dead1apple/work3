import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'

interface StatePanelProps {
  type: 'loading' | 'error' | 'empty'
  message?: string
  onRetry?: () => void
}

export function StatePanel({ type, message, onRetry }: StatePanelProps) {
  const content = {
    loading: { icon: <LoaderCircle className="spin" />, title: '正在同步数据', detail: message || '请稍候' },
    error: { icon: <AlertCircle />, title: '数据加载失败', detail: message || '暂时无法连接后端服务' },
    empty: { icon: <Inbox />, title: '暂无符合条件的数据', detail: message || '调整筛选条件后再试试' },
  }[type]

  return (
    <div className="state-panel">
      <div className={`state-icon state-${type}`}>{content.icon}</div>
      <strong>{content.title}</strong>
      <span>{content.detail}</span>
      {onRetry && <button className="secondary-button" type="button" onClick={onRetry}><RefreshCw size={15} />重新加载</button>}
    </div>
  )
}
