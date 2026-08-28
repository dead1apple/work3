export interface TabOption<T extends string> { value: T, label: string, count?: number }

export function Tabs<T extends string>({ value, options, onChange, label = '视图切换' }: { value: T, options: TabOption<T>[], onChange: (value: T) => void, label?: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((option) => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} className={value === option.value ? 'tab-active' : ''} onClick={() => onChange(option.value)}>{option.label}{option.count != null && <span>{option.count}</span>}</button>)}
    </div>
  )
}
