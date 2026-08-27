import { clampQuantity, parseImages, readList } from './format.js'
import { resolveAssetUrl } from './config.js'

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

export function normalizeCategoryTree(payload) {
	const source = Array.isArray(payload) ? payload : readList(payload)
	return source.map((item) => {
		const category = item?.category || item || {}
		return {
			...category,
			id: number(category.id),
			name: category.name || category.categoryName || '未命名分类',
			icon: resolveAssetUrl(category.icon),
			children: normalizeCategoryTree(item?.children || category.children || []),
		}
	}).filter((item) => item.id)
}

export function flattenCategories(tree, depth = 0) {
	return tree.flatMap((item) => [{ ...item, depth }, ...flattenCategories(item.children || [], depth + 1)])
}

export function normalizeProductList(payload) {
	const list = readList(payload).map((item) => {
		const product = item?.product || item || {}
		return {
			id: number(product.id),
			title: product.name || product.title || '未命名商品',
			subtitle: product.subtitle || '',
			image: parseImages(product.mainImage, product.images)[0] || '',
			price: number(first(item.minPrice, product.minPrice, product.price)),
			maxPrice: number(first(item.maxPrice, product.maxPrice, item.minPrice, product.price)),
			sales: Math.max(0, number(first(product.salesCount, product.sales))),
			stock: Math.max(0, number(first(item.totalStock, product.stock))),
		}
	}).filter((item) => item.id)
	return { list, total: Math.max(0, number(payload?.total, list.length)) }
}

export function normalizeBrandList(payload) {
	return readList(payload).map((item) => {
		const brand = item?.brand || item || {}
		return {
			...brand,
			id: number(first(brand.id, brand.brandId)),
			name: first(brand.name, brand.brandName, '未命名品牌'),
			logo: resolveAssetUrl(first(brand.logo, brand.logoUrl, brand.image)),
			description: first(brand.description, brand.introduction, brand.summary, ''),
		}
	}).filter((item) => item.id)
}

export function normalizeBrandDetail(payload) {
	const source = payload?.brand || payload || {}
	return normalizeBrandList([source])[0] || null
}

function parseSpecs(value) {
	if (value && typeof value === 'object' && !Array.isArray(value)) return value
	try {
		const parsed = JSON.parse(value || '{}')
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
	} catch {
		return {}
	}
}

export function normalizeProductDetail(payload) {
	const source = payload || {}
	const product = source.product || source
	const skuList = (source.skuList || product.skuList || []).map((sku) => ({
		...sku,
		id: number(sku.id),
		price: Math.max(0, number(sku.price)),
		marketPrice: Math.max(0, number(sku.marketPrice)),
		stock: Math.max(0, number(sku.stock)),
		image: resolveAssetUrl(sku.image),
		specs: parseSpecs(sku.specValues),
	}))
	const optionMap = new Map()
	skuList.forEach((sku) => Object.entries(sku.specs).forEach(([label, value]) => {
		if (!optionMap.has(label)) optionMap.set(label, [])
		if (!optionMap.get(label).includes(value)) optionMap.get(label).push(value)
	}))
	const prices = skuList.map((sku) => sku.price).filter((price) => price >= 0)
	return {
		id: number(product.id),
		title: product.name || product.title || '未命名商品',
		subtitle: product.subtitle || '',
		images: parseImages(product.mainImage, product.images, skuList.map((sku) => sku.image)),
		detail: product.detail || '',
		sales: Math.max(0, number(first(product.salesCount, product.sales))),
		price: prices.length ? Math.min(...prices) : number(first(source.minPrice, product.price)),
		shop: source.shop || product.shop || null,
		skuList,
		options: Array.from(optionMap, ([label, values]) => ({ label, values })),
	}
}

export function normalizeCartList(payload) {
	return readList(payload).map((item) => {
		const cart = item.cart || item.cartItem || item
		const sku = item.sku || item.productSku || item.skuInfo || {}
		const product = item.product || sku.product || {}
		return {
			id: number(first(cart.id, cart.cartItemId)),
			skuId: number(first(cart.skuId, sku.id, cart.productId)),
			productId: number(first(item.productId, product.id)),
			name: item.productName || product.name || item.name || sku.skuName || '商品',
			skuName: item.skuName || sku.skuName || '',
			image: resolveAssetUrl(first(item.image, sku.image, product.mainImage)),
			price: Math.max(0, number(first(item.price, item.skuPrice, sku.price))),
			quantity: clampQuantity(first(cart.quantity, cart.buyQuantity)),
			selected: cart.selected === 1 || cart.selected === true || cart.checked === true,
		}
	}).filter((item) => item.id && item.skuId)
}

export function normalizeAddressList(payload) {
	return readList(payload).map((item) => ({
		...item,
		id: number(item.id),
		receiverName: item.receiverName || item.name || '',
		receiverPhone: item.receiverPhone || item.phone || '',
		isDefault: item.isDefault === 1 || item.isDefault === true,
		fullAddress: [item.province, item.city, item.district, item.detailAddress || item.address].filter(Boolean).join(''),
	})).sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

const ORDER_STATUS = {
	0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '已退款',
}

export function normalizeOrderList(payload) {
	const list = readList(payload).map((order) => ({
		...order,
		orderNo: first(order.orderNo, order.orderNumber, order.id, ''),
		status: number(order.status, -1),
		statusText: order.statusName || order.statusText || ORDER_STATUS[number(order.status, -1)] || '处理中',
		payAmount: Math.max(0, number(first(order.payAmount, order.totalAmount, order.actualAmount))),
		createTime: first(order.createTime, order.createdAt, ''),
		items: (order.items || order.orderItems || []).map(normalizeOrderItem),
	}))
	return { list, total: Math.max(0, number(payload?.total, list.length)) }
}

export function normalizeOrderItem(item) {
	const price = Math.max(0, number(first(item.price, item.unitPrice, item.salePrice)))
	const quantity = clampQuantity(first(item.quantity, item.count, item.num))
	const id = first(item.orderItemId, item.id)
	return {
		id,
		orderItemId: id,
		productId: first(item.productId, item.spuId, item.product?.id),
		name: first(item.productName, item.name, item.skuName, item.product?.name, '商品'),
		spec: first(item.specName, item.skuName, item.spec, ''),
		image: resolveAssetUrl(first(item.productImage, item.skuImage, item.image, item.mainImage, item.product?.mainImage)),
		price,
		quantity,
		subtotal: Math.max(0, number(first(item.subtotal, item.totalAmount, item.amount), price * quantity)),
	}
}

export function normalizeOrderDetail(payload) {
	const source = payload || {}
	const order = source.order || source.orderInfo || source
	const items = source.items || source.orderItems || source.details || order.items || order.orderItems || []
	const status = number(order.status, -1)
	const address = source.address || source.deliveryAddress || order.address || {}
	const addressParts = [address.province, address.city, address.district, address.detailAddress || address.address].filter(Boolean)
	const normalizedItems = Array.isArray(items) ? items.map(normalizeOrderItem) : []
	const goodsAmount = Math.max(0, number(first(order.goodsAmount, order.productAmount), normalizedItems.reduce((sum, item) => sum + item.subtotal, 0)))
	return {
		...order,
		orderNo: first(order.orderNo, order.orderNumber, order.id, ''),
		status,
		statusText: order.statusName || order.statusText || ORDER_STATUS[status] || '处理中',
		payAmount: Math.max(0, number(first(order.payAmount, order.totalAmount, order.actualAmount))),
		goodsAmount,
		freightAmount: Math.max(0, number(first(order.freightAmount, order.shippingFee))),
		discountAmount: Math.max(0, number(first(order.discountAmount, order.couponAmount))),
		createTime: first(order.createTime, order.createdAt, ''),
		payTime: first(order.payTime, ''),
		deliveryTime: first(order.deliveryTime, order.shipTime, ''),
		receiveTime: first(order.receiveTime, order.completeTime, ''),
		payDeadline: first(order.payDeadline, ''),
		receiverName: first(address.receiverName, address.name, order.receiverName, ''),
		receiverPhone: first(address.receiverPhone, address.phone, order.receiverPhone, ''),
		fullAddress: first(order.receiverAddress, address.fullAddress, addressParts.join(''), ''),
		remark: first(order.remark, order.orderRemark, ''),
		logisticsCompany: first(order.logisticsCompany, order.expressCompany, ''),
		logisticsNo: first(order.logisticsNo, order.trackingNo, order.expressNo, ''),
		payment: source.payment || order.payment || null,
		items: normalizedItems,
	}
}

export function normalizeUser(payload) {
	const user = payload?.user || payload || {}
	return {
		...user,
		id: first(user.id, user.userId),
		username: first(user.username, user.userName, ''),
		nickname: first(user.nickname, user.nickName, user.username, user.userName, '商城用户'),
		phone: first(user.phone, user.mobile, ''),
		email: first(user.email, ''),
		avatar: resolveAssetUrl(first(user.avatar, user.avatarUrl, '')),
		gender: [0, 1, 2].includes(number(user.gender)) ? number(user.gender) : 0,
		birthday: /^\d{4}-\d{2}-\d{2}/.test(String(user.birthday || '')) ? String(user.birthday).slice(0, 10) : '',
	}
}

const COUPON_STATUS = { 0: '未使用', 1: '已使用', 2: '已过期' }

export function normalizeCouponList(payload, mode = 'available', templates = []) {
	const templateMap = new Map((templates || []).map((item) => [number(first(item.templateId, item.id)), item]))
	return readList(payload).map((item) => {
		const record = item?.userCoupon || item || {}
		const embedded = item?.couponTemplate || item?.template || item?.coupon || record?.couponTemplate
		const templateId = first(record.couponTemplateId, record.templateId, item.couponTemplateId, item.templateId, embedded?.id, item.id)
		const template = embedded || templateMap.get(number(templateId)) || record
		const status = mode === 'mine' ? number(first(record.status, item.status), 0) : null
		const id = mode === 'mine' ? first(record.id, item.userCouponId, item.id) : templateId
		const hasTemplateData = mode !== 'mine' || Boolean(embedded || templateMap.get(number(templateId)) || record.amount != null || record.discountAmount != null)
		const shopId = first(template.shopId, item.shopId)
		return {
			id,
			templateId,
			name: first(template.name, template.couponName, item.name, '优惠券'),
			amount: Math.max(0, number(first(template.amount, template.discountAmount, item.amount))),
			minAmount: Math.max(0, number(first(template.minAmount, template.threshold, item.minAmount))),
			type: number(first(template.type, item.type), 1) || 1,
			status,
			statusText: mode === 'mine' ? first(record.statusName, item.statusName, COUPON_STATUS[status], '状态未知') : '可领取',
			startTime: String(first(template.startTime, record.startTime, item.startTime, '')).slice(0, 10),
			endTime: String(first(template.endTime, record.endTime, item.endTime, '')).slice(0, 10),
			shopName: first(template.shopName, item.shopName, shopId ? '店铺专享券' : '商城平台券'),
			hasTemplateData,
		}
	}).filter((item) => item.id != null && item.templateId != null)
}

export function filterUsableCoupons(coupons, goodsAmount) {
	const amount = Math.max(0, number(goodsAmount))
	return (coupons || []).filter((item) => item.hasTemplateData !== false && Number(item.status) === 0 && amount >= item.minAmount)
}

export function getCouponValueText(coupon) {
	if (coupon?.hasTemplateData === false) return '优惠待同步'
	const amount = Math.max(0, number(coupon?.amount))
	if (Number(coupon?.type) === 2) return `${Number.isInteger(amount / 10) ? amount / 10 : (amount / 10).toFixed(1)}折`
	return `¥${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

export function getCouponDiscount(coupon, goodsAmount) {
	const goods = Math.max(0, number(goodsAmount))
	if (!coupon || coupon.hasTemplateData === false) return 0
	const value = Math.max(0, number(coupon.amount))
	const discount = Number(coupon.type) === 2 ? goods * (1 - Math.min(100, value) / 100) : value
	return Math.round(Math.min(goods, Math.max(0, discount)) * 100) / 100
}

const PAID_STATUS = new Set([1, '1', 'PAID', 'SUCCESS', 'SUCCESSFUL', '已支付', '支付成功'])
const FAILED_STATUS = new Set([-1, 2, '-1', '2', 'FAIL', 'FAILED', 'CLOSED', 'CANCELLED', '支付失败', '已关闭'])

export function extractPaymentNo(payload) {
	const source = payload || {}
	if (typeof source === 'string' || typeof source === 'number') return String(source)
	return String(first(source.paymentNo, source.payment?.paymentNo, source.id, ''))
}

export function normalizePaymentStatus(payload) {
	const source = payload || {}
	const payment = source.payment || (source.paymentNo || source.status != null ? source : null)
	const rawStatus = first(payment?.status, source.status)
	const statusName = first(payment?.statusName, source.statusName, '')
	const upperStatus = String(rawStatus || '').toUpperCase()
	const isPaid = source.isPaid === true || PAID_STATUS.has(rawStatus) || PAID_STATUS.has(statusName) || PAID_STATUS.has(upperStatus)
	const isFailed = FAILED_STATUS.has(rawStatus) || FAILED_STATUS.has(statusName) || FAILED_STATUS.has(upperStatus)
	if (isPaid) return { state: 'paid', title: '支付成功', description: '订单已支付，商家将尽快发货。', paymentNo: extractPaymentNo(payment), payType: number(payment?.payType, 0) }
	if (isFailed) return { state: 'failed', title: '支付未完成', description: '本次支付没有成功，可以重新选择支付方式。', paymentNo: extractPaymentNo(payment), payType: number(payment?.payType, 0) }
	if (payment) return { state: 'processing', title: '支付处理中', description: '支付结果正在确认，请稍候。', paymentNo: extractPaymentNo(payment), payType: number(payment?.payType, 0) }
	return { state: 'unpaid', title: '等待付款', description: '请选择支付方式完成付款。', paymentNo: '', payType: 0 }
}

export function normalizeFavoriteList(payload) {
	return readList(payload).map((item) => {
		const product = item.product || item.productInfo || item
		return {
			favoriteId: first(item.favoriteId, item.id),
			productId: number(first(item.productId, product.id)),
			title: first(product.name, product.title, item.productName, '商品信息暂不可用'),
			image: resolveAssetUrl(first(product.mainImage, product.image, item.image)),
			price: Math.max(0, number(first(item.minPrice, product.minPrice, product.price, item.price))),
			sales: Math.max(0, number(first(product.salesCount, product.sales, item.sales))),
		}
	}).filter((item) => item.productId)
}

export function normalizeReviewList(payload) {
	const list = readList(payload).map((item) => {
		const review = item?.review || item || {}
		const user = item?.user || review.user || {}
		const anonymous = review.isAnonymous === 1 || review.isAnonymous === true
		return {
			id: first(review.id, review.reviewId),
			name: anonymous ? '匿名用户' : first(user.nickname, user.username, review.nickname, review.username, '商城用户'),
			avatar: anonymous ? '' : resolveAssetUrl(first(user.avatar, user.avatarUrl, review.avatar, '')),
			rating: Math.max(1, Math.min(5, number(review.rating, 5))),
			content: first(review.content, review.comment, '用户未填写评价内容。'),
			images: parseImages(review.images),
			reply: first(review.reply, review.merchantReply, ''),
			createTime: first(review.createTime, review.createdAt, ''),
		}
	})
	return { list, total: Math.max(0, number(payload?.total, list.length)) }
}
