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
