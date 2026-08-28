import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function SelectionBar({ count, children, onClear }: { count: number, children: ReactNode, onClear: () => void }) {
  if (!count) return null
  return <div className="selection-bar"><strong>已选择 {count} 项</strong><div>{children}</div><button className="icon-button" type="button" title="清除选择" aria-label="清除选择" onClick={onClear}><X /></button></div>
}
