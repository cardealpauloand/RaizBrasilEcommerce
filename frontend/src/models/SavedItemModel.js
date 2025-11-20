import { api } from '../lib/api.js'

const KEY = 'rb_saved_local'

export default {
  // Load saved items from backend or localStorage
  async load() {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.get('/api/saved')
      } catch (err) {
        // Fallback to local cache if backend fails
        console.warn('Failed to load saved items from backend:', err.message)
        return this.loadLocal()
      }
    }
    // No token - use local storage
    return this.loadLocal()
  },

  // Load saved items locally
  loadLocal() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  // Add item to saved list
  async add(productId, size) {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.post('/api/saved', {
          product_id: productId,
          size: size || 'M'
        })
      } catch (err) {
        throw new Error(err.message || 'Erro ao salvar item')
      }
    }
    // Fallback to localStorage
    const items = this.loadLocal()
    const item = { id: Date.now(), product_id: productId, size: size || 'M', saved_at: new Date().toISOString() }
    items.push(item)
    this.saveLocal(items)
    return item
  },

  // Remove item from saved list
  async remove(itemId) {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.delete(`/api/saved/${itemId}`)
      } catch (err) {
        throw new Error(err.message || 'Erro ao remover item')
      }
    }
    // Fallback to localStorage
    const items = this.loadLocal()
    const filtered = items.filter(i => i.id !== itemId)
    this.saveLocal(filtered)
    return true
  },

  // Clear all saved items
  async clear() {
    const token = localStorage.getItem('rb_token_v1')
    if (token) {
      try {
        return await api.delete('/api/saved/clear')
      } catch (err) {
        throw new Error(err.message || 'Erro ao limpar salvos')
      }
    }
    this.saveLocal([])
  },

  // Save locally
  saveLocal(items) {
    localStorage.setItem(KEY, JSON.stringify(items))
  }
}
