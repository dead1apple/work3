import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'muted'

export function StatusBadge({ children, tone = 'muted' }: { children: ReactNode, tone?: BadgeTone }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{children}</span>
}
