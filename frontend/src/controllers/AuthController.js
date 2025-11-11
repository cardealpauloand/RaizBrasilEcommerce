import UserModel from '../models/UserModel'
const OrdersKey = 'rb_orders_v1'

export default {
  register(payload){ return UserModel.create(payload) },
  login(payload){ return UserModel.login(payload) },
  logout(){ return UserModel.logout() },
  current(){ return UserModel.current() },
  isAdmin(){ return UserModel.ensureAdmin() },
  placeOrder(order){
    const cur = this.current()
    const raw = localStorage.getItem(OrdersKey)
    const orders = raw ? JSON.parse(raw) : []
    const o = { id: 'ord_' + Date.now(), date: new Date().toISOString(), status: 'pago', user: cur ? { id: cur.id, name: cur.name, email: cur.email } : null, ...order }
    orders.push(o)
    localStorage.setItem(OrdersKey, JSON.stringify(orders))
    return o
  },
  listOrders(){
    const raw = localStorage.getItem(OrdersKey)
    return raw ? JSON.parse(raw) : []
  },
  updateOrderStatus(id, status){
    const ALLOWED = ['novo','aguardando','pago','processando','enviado','entregue','cancelado']
    const st = String(status || '').toLowerCase()
    if(!ALLOWED.includes(st)) throw new Error('Status inválido')
    const raw = localStorage.getItem(OrdersKey)
    const orders = raw ? JSON.parse(raw) : []
    const idx = orders.findIndex(o => o.id === id)
    if(idx === -1) throw new Error('Pedido não encontrado')
    orders[idx] = { ...orders[idx], status: st }
    localStorage.setItem(OrdersKey, JSON.stringify(orders))
    return orders[idx]
  }
}
