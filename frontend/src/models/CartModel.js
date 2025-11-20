import { api } from '../lib/api.js'

const KEY = 'rb_cart_local'

export default {
  // Load cart from backend or localStorage fallback
  async load() {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.get('/api/cart')
      } catch (err) {
        // Fallback to local cache if backend fails
        console.warn('Failed to load cart from backend:', err.message)
        return this.loadLocal()
      }
    }
    // No token - use local storage
    return this.loadLocal()
  },

  // Save cart locally (for non-authenticated users)
  loadLocal() {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { items: [] }
  },

  // Add item to cart
  async addItem(productId, qty, size) {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.post('/api/cart/items', {
          product_id: productId,
          qty: qty,
          size: size || 'M'
        })
      } catch (err) {
        throw new Error(err.message || 'Erro ao adicionar item')
      }
    }
    // Fallback to localStorage
    const cart = this.loadLocal()
    const existing = cart.items.find(i => i.product_id === productId && i.size === size)
    if (existing) {
      existing.qty += qty
    } else {
      cart.items.push({ product_id: productId, qty, size: size || 'M' })
    }
    this.saveLocal(cart)
    return cart
  },

  // Update item quantity
  async updateItem(itemId, qty) {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.put(`/api/cart/items/${itemId}`, { qty })
      } catch (err) {
        throw new Error(err.message || 'Erro ao atualizar item')
      }
    }
    // Not implemented for localStorage
    throw new Error('Item update requires authentication')
  },

  // Remove item from cart
  async removeItem(itemId) {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.delete(`/api/cart/items/${itemId}`)
      } catch (err) {
        throw new Error(err.message || 'Erro ao remover item')
      }
    }
    throw new Error('Item removal requires authentication')
  },

  // Clear entire cart
  async clear() {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.delete('/api/cart')
      } catch (err) {
        throw new Error(err.message || 'Erro ao limpar carrinho')
      }
    }
    this.saveLocal({ items: [] })
  },

  // Save cart locally
  saveLocal(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart))
  }
}
