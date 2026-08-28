import type { ReactNode } from 'react'

export function PageTitle({ title, description, actions }: { title: string, description: string, actions?: ReactNode }) {
  return (
    <header className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}
