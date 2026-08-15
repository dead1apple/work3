import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  size: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, size, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <div className="pagination">
      <span>共 {total} 条</span>
      <div className="pagination-controls">
        <button className="icon-button" type="button" aria-label="上一页" title="上一页" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft /></button>
        <span>{page} / {pages}</span>
        <button className="icon-button" type="button" aria-label="下一页" title="下一页" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight /></button>
      </div>
    </div>
  )
}
