import { reactive, ref } from 'vue'
import * as catalogApi from '../../api/catalog'
import * as productApi from '../../api/product'
import {
  buildProductPayload,
  createProductForm,
  createSkuRow,
  toCategoryOptions,
  validateProductForm,
} from './product-create'

export class ProductFormValidationError extends Error {
  constructor(errors) {
    super('请检查商品表单')
    this.name = 'ProductFormValidationError'
    this.errors = errors
  }
}

export function useProductCreate() {
  const form = reactive(createProductForm())
  const categoryOptions = ref([])
  const brands = ref([])
  const catalogLoading = ref(false)
  const catalogError = ref(null)
  const validationErrors = ref({})
  const submitting = ref(false)
  const submitError = ref(null)
  let submitPromise = null

  async function loadCatalogs() {
    catalogLoading.value = true
    catalogError.value = null

    try {
      const [categoryTree, brandList] = await Promise.all([
        catalogApi.getCategoryTree(),
        catalogApi.getBrands(),
      ])
      categoryOptions.value = toCategoryOptions(categoryTree)
      brands.value = brandList
    } catch (error) {
      categoryOptions.value = []
      brands.value = []
      catalogError.value = error
      throw error
    } finally {
      catalogLoading.value = false
    }
  }

  function addSku() {
    form.skuList.push(createSkuRow())
    delete validationErrors.value.skuList
  }

  function removeSku(key) {
    const index = form.skuList.findIndex((sku) => sku.key === key)
    if (index >= 0) form.skuList.splice(index, 1)
  }

  function submit() {
    if (submitPromise) return submitPromise

    const errors = validateProductForm(form)
    validationErrors.value = errors
    if (Object.keys(errors).length > 0) {
      return Promise.reject(new ProductFormValidationError(errors))
    }

    submitting.value = true
    submitError.value = null
    const requestPromise = productApi.createMerchantProduct(buildProductPayload(form))
    const currentPromise = requestPromise
      .catch((error) => {
        submitError.value = error
        throw error
      })
      .finally(() => {
        submitting.value = false
        if (submitPromise === currentPromise) submitPromise = null
      })

    submitPromise = currentPromise
    return currentPromise
  }

  return {
    form,
    categoryOptions,
    brands,
    catalogLoading,
    catalogError,
    validationErrors,
    submitting,
    submitError,
    loadCatalogs,
    addSku,
    removeSku,
    submit,
  }
}
