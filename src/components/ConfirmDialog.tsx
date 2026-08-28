import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  tone?: 'primary' | 'danger'
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, description, confirmText = '确认', tone = 'primary', pending, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button className="icon-button dialog-close" type="button" title="关闭" aria-label="关闭" onClick={onCancel}><X /></button>
        <div className={`dialog-icon dialog-${tone}`}><AlertTriangle /></div>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel} disabled={pending}>取消</button>
          <button className={tone === 'danger' ? 'danger-button' : 'primary-button'} type="button" onClick={onConfirm} disabled={pending}>{pending ? '处理中...' : confirmText}</button>
        </div>
      </div>
    </div>
  )
}
