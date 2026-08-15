/** @typedef {{ code: number, msg: string, data: any }} ApiResponse */
/** @typedef {{ username: string, password: string }} LoginDTO */
/** @typedef {{ phone: string, code?: string, username?: string, password?: string, nickname?: string, email?: string }} RegisterDTO */
/** @typedef {{ phone: string }} SendCodeDTO */
/** @typedef {{ id: number, username: string, phone?: string, nickname?: string, email?: string, avatar?: string, status?: number, createTime?: string }} UserInfo */
/** @typedef {{ id?: number, receiverName: string, receiverPhone: string, province?: string, city?: string, district?: string, detailAddress: string, isDefault?: number }} AddressDTO */
/** @typedef {{ skuId: number, quantity: number }} CartDTO */
/** @typedef {{ id?: number, skuName?: string, specValues?: string, price?: number, marketPrice?: number, stock?: number, image?: string }} SkuDTO */
/** @typedef {{ cartIds?: number[], addressId?: number, couponId?: number, remark?: string }} CreateOrderDTO */
/** @typedef {{ orderNo?: string, orderItemId: number, rating: number, content: string, images?: string[], isAnonymous?: boolean }} ReviewDTO */
/** @typedef {{ skuId: number, quantity: number, addressId?: number, couponId?: number, remark?: string }} BuyNowDTO */
/** @typedef {{ id?: number, shopName?: string, logo?: string, description?: string, licenseImage?: string, status?: number, rating?: number }} Shop */
/** @typedef {{ id?: number, categoryId?: number, brandId?: number, name?: string, subtitle?: string, mainImage?: string, images?: string[], detail?: string, status?: number, skuList?: SkuDTO[] }} ProductDTO */
/** @typedef {{ orderNo: string, logisticsCompany: string, logisticsNo: string }} DeliverDTO */
/** @typedef {{ id: number, name: string, parentId?: number, level?: number, sort?: number, status?: number, children?: Category[] }} Category */
/** @typedef {{ id: number, name: string, logo?: string, description?: string, status?: number }} Brand */
/** @typedef {{ id?: number, templateId?: number, name?: string, amount?: number, threshold?: number, startTime?: string, endTime?: string, status?: number }} Coupon */
/** @typedef {{ orderNo: string, amount?: number, paymentMethod?: string }} CreatePaymentDTO */
/** @typedef {{ orderNo: string, status?: number, transactionNo?: string }} ConfirmPaymentDTO */
/** @typedef {{ orderNo: string, status?: number, totalAmount?: number, address?: AddressDTO, items?: CartDTO[] }} Order */

export const API_SUCCESS_CODE = 1
