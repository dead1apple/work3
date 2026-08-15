import request from '../utils/request'

export const createPayment = ({ orderNo, payType }) => request.post('/pay/create', null, { params: { orderNo, payType } })
export const confirmPayment = ({ paymentNo }) => request.post('/pay/confirm', null, { params: { paymentNo } })
export const getPaymentStatus = (orderNo) => request.get('/pay/status', { params: { orderNo } })
