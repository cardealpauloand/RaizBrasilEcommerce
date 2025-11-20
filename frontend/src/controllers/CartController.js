import CartModel from '../models/CartModel'
import ProductModel from '../models/ProductModel'

export default {
  // Load cart from backend or localStorage
  async getCart() {
    return await CartModel.load()
  },

  // Add item to cart
  async add(productId, qty = 1, size = 'M') {
    const product = ProductModel.findById(productId)
    if (!product) throw new Error('Produto não encontrado')

    try {
      // Try to add via API if authenticated
      return await CartModel.addItem(productId, qty, size)
    } catch (err) {
      // Fallback to localStorage for non-authenticated users
      if (!localStorage.getItem('rb_token_v1')) {
        const cart = CartModel.loadLocal()
        const found = cart.items.find(i => i.product_id === productId && (i.size || 'M') === size)
        if (found) {
          found.qty += qty
        } else {
          cart.items.push({ product_id: productId, title: product.title, price: product.price, qty, size })
        }
        CartModel.saveLocal(cart)
        return cart
      }
      throw err
    }
  },

  // Update item quantity
  async update(itemId, qty, size = 'M') {
    if (qty <= 0) {
      return await this.remove(itemId)
    }

    try {
      await CartModel.updateItem(itemId, qty)
      return await CartModel.load()
    } catch (err) {
      // Only works with authentication
      throw err
    }
  },

  // Remove item from cart
  async remove(itemId, size = 'M') {
    try {
      await CartModel.removeItem(itemId)
      return await CartModel.load()
    } catch (err) {
      // Fallback for localStorage
      if (!localStorage.getItem('rb_token_v1')) {
        const cart = CartModel.loadLocal()
        // For localStorage, itemId is actually productId
        cart.items = cart.items.filter(i => !(i.product_id === itemId && (i.size || 'M') === size))
        CartModel.saveLocal(cart)
        return cart
      }
      throw err
    }
  },

  // Calculate total
  async total() {
    const cart = await CartModel.load()
    const sum = cart.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
    return Number(sum.toFixed(2))
  },

  // Clear entire cart
  async clear() {
    return await CartModel.clear()
  }
}
