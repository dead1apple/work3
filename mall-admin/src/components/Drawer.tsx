import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  title: string
  subtitle?: string
  width?: 'medium' | 'wide'
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export function Drawer({ open, title, subtitle, width = 'medium', children, footer, onClose }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className={`detail-drawer drawer-${width}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer-header">
          <div><span>DETAIL VIEW</span><h2 id="drawer-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button className="icon-button" type="button" aria-label="关闭" title="关闭" onClick={onClose}><X /></button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </div>
  )
}
