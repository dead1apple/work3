export function ToggleSwitch({ checked, label, description, disabled, onChange }: { checked: boolean, label: string, description?: string, disabled?: boolean, onChange: (checked: boolean) => void }) {
  return (
    <label className={`toggle-row ${disabled ? 'toggle-disabled' : ''}`}>
      <span><strong>{label}</strong>{description && <small>{description}</small>}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true"><b /></i>
    </label>
  )
}
