import { pcaTextArr } from 'element-china-area-data'

export function buildRegionOptions() {
  return pcaTextArr
}

export function getProvinces() {
  return pcaTextArr.map(({ label, value }) => ({ label, value }))
}

export function getCities(province) {
  return pcaTextArr.find((item) => item.value === province)?.children || []
}

export function getDistricts(province, city) {
  if (!province || !city) return []
  return getCities(province).find((item) => item.value === city)?.children || []
}

export function resolveRegionPath(path = []) {
  const [province = '', city = '', district = ''] = path
  return { province, city, district }
}
