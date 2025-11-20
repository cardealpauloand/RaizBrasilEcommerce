// UserModel with JWT-based authentication and backend API integration
import { api } from '../lib/api.js'

const KEY_TOKEN = 'rb_token_v1'
const KEY_CURRENT = 'rb_current_user'

export default {
  // Get the stored JWT token
  getToken() {
    return localStorage.getItem(KEY_TOKEN)
  },

  // Get the current user from localStorage
  current() {
    return JSON.parse(localStorage.getItem(KEY_CURRENT))
  },

  // Register a new user
  async register({ name, email, password }) {
    try {
      const response = await api.post('/api/register', { name, email, password })
      if (!response || response.error) {
        throw new Error(response?.error || 'Erro ao registrar')
      }
      return response
    } catch (err) {
      throw new Error(err.message || 'Erro ao registrar usuário')
    }
  },

  // Login with email and password
  async login({ email, password }) {
    try {
      const response = await api.post('/api/login', { email, password })
      if (!response || !response.token) {
        throw new Error(response?.error || 'Erro ao fazer login')
      }

      // Store the token and user data
      localStorage.setItem(KEY_TOKEN, response.token)
      localStorage.setItem(KEY_CURRENT, JSON.stringify(response.user))

      return response.user
    } catch (err) {
      throw new Error(err.message || 'Erro ao fazer login')
    }
  },

  // Fetch current user data from backend
  async fetchCurrent() {
    try {
      const token = this.getToken()
      if (!token) {
        return null
      }

      const response = await api.get('/api/me')
      if (!response || response.error) {
        // Token inválido, fazer logout
        this.logout()
        return null
      }

      // Update cached user data
      localStorage.setItem(KEY_CURRENT, JSON.stringify(response))
      return response
    } catch (err) {
      // Token inválido ou expirado
      this.logout()
      return null
    }
  },

  // Check if user is admin
  ensureAdmin() {
    const user = this.current()
    return user && user.is_admin
  },

  // Logout
  logout() {
    localStorage.removeItem(KEY_TOKEN)
    localStorage.removeItem(KEY_CURRENT)
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken()
  }
}
