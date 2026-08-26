import { ref } from 'vue'
import * as productApi from '../../api/product'
import { ProductFormValidationError, useProductCreate } from './useProductCreate'
import { buildProductUpdatePayload, hydrateProductForm, validateProductForm } from './product-create'

export function useProductEdit(productId) {
  const productCreate = useProductCreate()
  const detailLoading = ref(false)
  const detailError = ref(null)
  let submitPromise = null

  async function loadProduct() {
    detailLoading.value = true
    detailError.value = null
    try {
      const detail = await productApi.getMerchantProduct(productId)
      hydrateProductForm(productCreate.form, detail, productCreate.categoryOptions.value)
      return detail
    } catch (error) {
      detailError.value = error
      throw error
    } finally {
      detailLoading.value = false
    }
  }

  function submit() {
    if (submitPromise) return submitPromise
    const errors = validateProductForm(productCreate.form)
    productCreate.validationErrors.value = errors
    if (Object.keys(errors).length > 0) return Promise.reject(new ProductFormValidationError(errors))

    productCreate.submitting.value = true
    productCreate.submitError.value = null
    const currentPromise = productApi.updateMerchantProduct(buildProductUpdatePayload(productCreate.form))
      .catch((error) => {
        productCreate.submitError.value = error
        throw error
      })
      .finally(() => {
        productCreate.submitting.value = false
        if (submitPromise === currentPromise) submitPromise = null
      })
    submitPromise = currentPromise
    return currentPromise
  }

  return { ...productCreate, detailLoading, detailError, loadProduct, submit }
}
