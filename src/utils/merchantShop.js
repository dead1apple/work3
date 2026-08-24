const baseView = (kind, title, description, actions = {}) => ({
  kind,
  title,
  description,
  canApply: false,
  canEnterMerchant: false,
  canRefreshUser: false,
  ...actions,
})

export const getMerchantShopView = (shop, role) => {
  if (shop === null) {
    return baseView('empty', '申请成为商家', '提交店铺资料后，平台将对您的申请进行审核。', { canApply: true })
  }
  if (!shop || typeof shop !== 'object') {
    return baseView('unknown', '未知店铺状态', '暂时无法识别当前店铺状态，请稍后重新加载。')
  }

  switch (shop.status) {
    case 0:
      return baseView('pending', '待审核', '您的店铺申请正在审核中。')
    case 1:
      if (role === 1) {
        return baseView('active', '审核通过 · 营业中', '店铺已通过审核，可以进入商家中心。', {
          canEnterMerchant: true,
        })
      }
      return baseView('role-unsynced', '店铺已通过，账号角色待同步', '请刷新账号状态；若仍未同步，请重新登录或联系平台管理员。', {
        canRefreshUser: role === 0,
      })
    case 2:
      return baseView('disabled', '店铺已被禁用', '当前店铺暂不可使用，请联系平台管理员了解详情。')
    case 3:
      return baseView('rejected', '申请未通过', '当前申请未通过，请等待进一步处理或联系平台管理员。')
    default:
      return baseView('unknown', '未知店铺状态', '暂时无法识别当前店铺状态，请稍后重新加载。')
  }
}

const clean = (value) => String(value ?? '').trim()
const isImageUrl = (value) => !value || /^(https?:\/\/|\/)/i.test(value)

export const buildShopApplicationPayload = (form) => ({
  shopName: clean(form?.shopName),
  logo: clean(form?.logo),
  description: clean(form?.description),
  licenseImage: clean(form?.licenseImage),
  location: clean(form?.location),
  address: clean(form?.address),
})

export const validateShopApplication = (form) => {
  const payload = buildShopApplicationPayload(form)
  const errors = {}
  if (!payload.shopName) errors.shopName = '请输入店铺名称'
  if (!isImageUrl(payload.logo)) errors.logo = '请输入有效的 http(s) 或站内图片地址'
  if (!isImageUrl(payload.licenseImage)) errors.licenseImage = '请输入有效的 http(s) 或站内图片地址'
  return errors
}

export const getMerchantProfileEntry = (role) => {
  if (role === 0) return { label: '商家入驻', path: '/merchant/apply' }
  if (role === 1) return { label: '商家中心', path: '/merchant' }
  if (role === 2) return { label: '管理后台', path: '/admin' }
  return null
}

export const createMerchantShopFlow = ({ getShop, applyShop }) => {
  let requestSequence = 0
  let pendingSubmission = null

  return {
    shop: undefined,
    loading: false,
    loadError: null,
    submitting: false,
    submissionError: null,
    submittedUnconfirmed: false,
    confirmationLoading: false,
    confirmationError: null,

    async load() {
      const sequence = ++requestSequence
      this.loading = true
      this.loadError = null
      try {
        const shop = await getShop()
        if (sequence !== requestSequence) return false
        this.shop = shop
        if (shop !== null) {
          this.submittedUnconfirmed = false
          this.confirmationError = null
        }
        return true
      } catch (error) {
        if (sequence !== requestSequence) return false
        this.shop = undefined
        this.loadError = error
        return false
      } finally {
        if (sequence === requestSequence) this.loading = false
      }
    },

    submit(form) {
      if (pendingSubmission) return pendingSubmission
      const validationErrors = validateShopApplication(form)
      if (Object.keys(validationErrors).length) {
        const error = new Error(Object.values(validationErrors)[0])
        error.validationErrors = validationErrors
        this.submissionError = error
        return Promise.resolve(false)
      }

      const payload = buildShopApplicationPayload(form)
      const sequence = ++requestSequence
      this.loading = false
      this.submitting = true
      this.submissionError = null
      this.confirmationError = null
      let postSucceeded = false

      pendingSubmission = (async () => {
        try {
          await applyShop(payload)
          postSucceeded = true
          const shop = await getShop()
          if (sequence !== requestSequence) return false
          this.shop = shop
          this.submittedUnconfirmed = shop === null
          return shop !== null
        } catch (error) {
          if (sequence !== requestSequence) return false
          if (postSucceeded) {
            this.shop = undefined
            this.submittedUnconfirmed = true
            this.confirmationError = error
          } else {
            this.submissionError = error
          }
          return false
        } finally {
          if (sequence === requestSequence) this.submitting = false
          pendingSubmission = null
        }
      })()

      return pendingSubmission
    },

    async refreshSubmittedStatus() {
      if (!this.submittedUnconfirmed) return false
      const sequence = ++requestSequence
      this.confirmationLoading = true
      this.confirmationError = null
      try {
        const shop = await getShop()
        if (sequence !== requestSequence) return false
        this.shop = shop
        this.submittedUnconfirmed = shop === null
        return shop !== null
      } catch (error) {
        if (sequence !== requestSequence) return false
        this.shop = undefined
        this.confirmationError = error
        return false
      } finally {
        if (sequence === requestSequence) this.confirmationLoading = false
      }
    },
  }
}
