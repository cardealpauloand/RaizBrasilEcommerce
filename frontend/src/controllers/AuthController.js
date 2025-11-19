import UserModel from '../models/UserModel'
import { api } from '../lib/api'
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
    // Try backend first
    return api.post('/api/orders/' + String(id).replace(/^ord_/,'') + '/status', { status: st })
      .catch(() => {
      // Fallback local
      const raw = localStorage.getItem(OrdersKey)
      const orders = raw ? JSON.parse(raw) : []
      const idx = orders.findIndex(o => o.id === id)
      if(idx === -1) throw new Error('Pedido não encontrado')
      orders[idx] = { ...orders[idx], status: st }
      localStorage.setItem(OrdersKey, JSON.stringify(orders))
      return orders[idx]
    })
  },
  async deleteOrder(id){
    const oid = String(id).replace(/^ord_/,'')
    try{
      await api.delete('/api/orders/' + oid)
      return true
    }catch{
      // Fallback: remove from local storage
      const raw = localStorage.getItem(OrdersKey)
      const orders = raw ? JSON.parse(raw) : []
      const next = orders.filter(o => String(o.id) !== String(id))
      localStorage.setItem(OrdersKey, JSON.stringify(next))
      return true
    }
  }
}
