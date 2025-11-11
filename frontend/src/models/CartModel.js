const KEY = 'rb_cart_v2'

export default {
  load(){
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { items: [] }
  },
  save(cart){
    localStorage.setItem(KEY, JSON.stringify(cart))
  },
  clear(){ localStorage.removeItem(KEY) }
}
