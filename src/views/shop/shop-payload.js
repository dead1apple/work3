function editableFields(source) {
  return {
    shopName: source.shopName.trim(),
    logo: source.logo || null,
    description: source.description.trim() || null,
    licenseImage: source.licenseImage || null,
    location: source.location.trim() || null,
    address: source.address.trim() || null,
  }
}

export function buildShopApplicationPayload(form) {
  return editableFields(form)
}

export function buildShopUpdatePayload(currentShop, form) {
  return {
    id: currentShop.id,
    userId: currentShop.userId,
    ...editableFields(form),
    status: currentShop.status,
    rating: currentShop.rating,
    createTime: currentShop.createTime,
    updateTime: currentShop.updateTime,
  }
}
