import React, {useState, useEffect} from 'react'
import Header from './components/Header'
import Home from './views/Home'
import ProductList from './views/ProductList'
import ProductPage from './views/ProductPage'
import Cart from './views/Cart'
import Profile from './views/Profile'
import AuthHub from './views/AuthHub'
import Checkout from './views/Checkout'
import AdminPanel from './views/AdminPanel'
import CartController from './controllers/CartController'
import AuthController from './controllers/AuthController'

function useHashRoute(){
  const [route, setRoute] = useState(location.hash.replace('#','') || 'home')
  useEffect(()=>{
    const onHash = ()=> setRoute(location.hash.replace('#','') || 'home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  function navigate(to, params){
    if(params) location.hash = to + '/' + params
    else location.hash = to
  }
  return {route, navigate}
}

export default function App(){
  const {route, navigate} = useHashRoute()
  const [cart, setCart] = useState(CartController.getCart())
  const [user, setUser] = useState(AuthController.current())
  const [message, setMessage] = useState(null)

  useEffect(()=>{
    // keep cart count updated on changes (simple polling for demo)
    const t = setInterval(()=> setCart(CartController.getCart()), 600)
    return () => clearInterval(t)
  }, [])

  function go(to){ navigate(to) }

  function handleAdd(productId, size='M'){ CartController.add(productId, 1, size); setCart(CartController.getCart()); setMessage('Produto adicionado ao carrinho') ; setTimeout(()=>setMessage(null),1200) }
  function handleLogout(){ AuthController.logout(); setUser(null) }

  // parse route and optional param like product id
  const [base, param] = route.split('/')

  return (
    <div className="app">
      <Header onNavigate={navigate} cartCount={cart.items.length} user={user} onLogout={handleLogout} />
  {message && <div style={{position:'fixed', left:20, bottom:20, background:'var(--success)', color:'white', padding:12, borderRadius:12, boxShadow:'0 12px 30px rgba(0,0,0,0.4)'}} className="bounce">{message}</div>}

  {base === 'home' && <Home onNavigate={navigate} onAdd={handleAdd} />}
      {base === 'products' && <ProductList onNavigate={navigate} onAdd={handleAdd} />}
      {base === 'product' && <ProductPage id={param} onAdd={handleAdd} />}
      {base === 'cart' && <Cart onNavigate={navigate} />}
  {base === 'profile' && <Profile onNavigate={navigate} onUserChange={u=>setUser(u)} />}
  {base === 'auth' && <AuthHub onNavigate={navigate} onUserChange={u=>setUser(u)} />}
      {base === 'checkout' && <Checkout onComplete={(order)=>{ setMessage('Compra finalizada! Pedido: ' + order.id); navigate('home') }} />}
      {base === 'admin' && <AdminPanel />}
      {base === 'login' && <Profile onNavigate={navigate} onUserChange={u=>setUser(u)} />}

  <footer style={{marginTop:'auto', padding:24, background:'linear-gradient(180deg, rgba(18,107,54,0.95), rgba(11,43,23,0.98))', color:'white'}}>
        <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
          <div className="center" style={{gap:10}}>
            <img src="/LOgoRaizBrasil.jpg" alt="Raiz Brasil" style={{height:28, borderRadius:8}} />
            <div>© {new Date().getFullYear()} Raiz Brasil — Camisetas para o campo</div>
          </div>
          <div style={{color:'#ffffff'}}>Vista o agro. Vista Raiz Brasil.</div>
        </div>
      </footer>
    </div>
  )
}
