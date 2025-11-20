import UserModel from '../models/UserModel'
import { api } from '../lib/api'

export default {
  async register(payload) {
    return await UserModel.register(payload)
  },

  async login(payload) {
    return await UserModel.login(payload)
  },

  logout() {
    return UserModel.logout()
  },

  current() {
    return UserModel.current()
  },

  isAdmin() {
    return UserModel.ensureAdmin()
  },

  isLoggedIn() {
    return UserModel.isLoggedIn()
  },

  async fetchCurrentUser() {
    return await UserModel.fetchCurrent()
  },

  async placeOrder(order) {
    const cur = this.current()
    const o = {
      user: cur ? { id: cur.id, name: cur.name, email: cur.email } : null,
      ...order
    }

    try {
      return await api.post('/api/orders', o)
    } catch (err) {
      throw new Error(err.message || 'Erro ao criar pedido')
    }
  },

  async listOrders() {
    try {
      return await api.get('/api/users/me/orders')
    } catch (err) {
      throw new Error(err.message || 'Erro ao listar pedidos')
    }
  },

  async updateOrderStatus(id, status) {
    const ALLOWED = ['novo', 'aguardando', 'pago', 'processando', 'enviado', 'entregue', 'cancelado']
    const st = String(status || '').toLowerCase()
    if (!ALLOWED.includes(st)) throw new Error('Status inválido')

    try {
      return await api.post(`/api/orders/${id}/status`, { status: st })
    } catch (err) {
      throw new Error(err.message || 'Erro ao atualizar status')
    }
  },

  async deleteOrder(id) {
    try {
      await api.delete(`/api/orders/${id}`)
      return true
    } catch (err) {
      throw new Error(err.message || 'Erro ao deletar pedido')
    }
  }
}
