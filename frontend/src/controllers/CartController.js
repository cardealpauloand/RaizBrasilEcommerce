import CartModel from '../models/CartModel'
import ProductModel from '../models/ProductModel'

function makeItem(product, qty=1, size='M'){
  return { productId: product.id, title: product.title, price: product.price, qty, size }
}

export default {
  getCart(){
    return CartModel.load()
  },
  add(productId, qty=1, size='M'){
    const product = ProductModel.findById(productId)
    if(!product) throw new Error('Produto não encontrado')
    const cart = CartModel.load()
    const found = cart.items.find(i => i.productId === productId && (i.size||'M') === size)
    if(found) found.qty += qty
    else cart.items.push(makeItem(product, qty, size))
    CartModel.save(cart)
    return cart
  },
  update(productId, qty, size='M'){
    const cart = CartModel.load()
    const found = cart.items.find(i => i.productId === productId && (i.size||'M') === size)
    if(found) found.qty = Math.max(0, qty)
    cart.items = cart.items.filter(i => i.qty > 0)
    CartModel.save(cart)
    return cart
  },
  remove(productId, size='M'){
    const cart = CartModel.load()
    cart.items = cart.items.filter(i => !(i.productId === productId && (i.size||'M') === size))
    CartModel.save(cart)
    return cart
  },
  total(){
    const cart = CartModel.load()
    const sum = cart.items.reduce((s,i)=> s + i.price * i.qty, 0)
    return Number(sum.toFixed(2))
  },
  clear(){ CartModel.clear() }
}
