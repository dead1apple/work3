const toText = (value) => String(value ?? '').trim()

export function buildAddressPayload(form = {}) {
  return {
    receiverName: toText(form.receiverName),
    receiverPhone: toText(form.receiverPhone),
    province: toText(form.province),
    city: toText(form.city),
    district: toText(form.district),
    detailAddress: toText(form.detailAddress),
    isDefault: form.isDefault === true || Number(form.isDefault) === 1 ? 1 : 0,
  }
}

export async function runAddressSaveWorkflow({
  isSaving,
  setSaving,
  validate,
  getForm,
  getEditingId,
  addAddress,
  updateAddress,
  onSuccess,
  closeDialog,
  reload,
  onError,
}) {
  if (isSaving()) return { skipped: true }
  setSaving(true)
  try {
    const valid = await Promise.resolve(validate()).catch(() => false)
    if (!valid) return { skipped: false, valid: false }

    const editingId = getEditingId()
    const payload = buildAddressPayload(getForm())
    if (editingId) await updateAddress({ id: editingId, ...payload })
    else await addAddress(payload)

    const mode = editingId ? 'update' : 'add'
    onSuccess?.(mode)
    closeDialog?.()
    await reload?.()
    return { skipped: false, valid: true, mode }
  } catch (error) {
    onError?.(error)
    return { skipped: false, valid: false, error }
  } finally {
    setSaving(false)
  }
}
