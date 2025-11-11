import React, {useState, useEffect, useRef} from 'react'
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
  const messageTimerRef = useRef(null)

  function showMessage(text, duration = 4000){
    // clear previous timer
    if(messageTimerRef.current){
      clearTimeout(messageTimerRef.current)
      messageTimerRef.current = null
    }
    setMessage(text)
    messageTimerRef.current = setTimeout(()=>{
      setMessage(null)
      messageTimerRef.current = null
    }, duration)
  }

  useEffect(()=>{
    // keep cart count updated on changes (simple polling for demo)
    const t = setInterval(()=> setCart(CartController.getCart()), 600)
    return () => clearInterval(t)
  }, [])

  function go(to){ navigate(to) }

  function handleAdd(productId, size='M'){
    CartController.add(productId, 1, size)
    setCart(CartController.getCart())
    showMessage('Produto adicionado ao carrinho')
  }
  function handleLogout(){ AuthController.logout(); setUser(null) }

  // parse route and optional param like product id
  const [base, param] = route.split('/')

  return (
    <div className="app">
      <Header onNavigate={navigate} cartCount={cart.items.length} user={user} onLogout={handleLogout} />
  {message && (
    <div
      className="bounce"
      onClick={()=>{ if(messageTimerRef.current){ clearTimeout(messageTimerRef.current); messageTimerRef.current=null;} setMessage(null) }}
      style={{
        position:'fixed',
        left:20,
        bottom:20,
        background:'var(--success)',
        color:'white',
        padding:14,
        borderRadius:14,
        boxShadow:'0 16px 40px rgba(0,0,0,0.55)',
        zIndex:1200,
        cursor:'pointer',
        fontWeight:600,
        letterSpacing:.3,
        backdropFilter:'blur(4px)'
      }}
      title="Clique para fechar"
    >{message}</div>
  )}

  {base === 'home' && <Home onNavigate={navigate} onAdd={handleAdd} />}
      {base === 'products' && <ProductList onNavigate={navigate} onAdd={handleAdd} />}
      {base === 'product' && <ProductPage id={param} onAdd={handleAdd} />}
      {base === 'cart' && <Cart onNavigate={navigate} />}
  {base === 'profile' && <Profile onNavigate={navigate} onUserChange={u=>setUser(u)} />}
  {base === 'auth' && <AuthHub onNavigate={navigate} onUserChange={u=>setUser(u)} />}
  {base === 'checkout' && <Checkout onComplete={(order)=>{ showMessage('Compra finalizada! Pedido: ' + order.id); navigate('home') }} />}
      {base === 'admin' && <AdminPanel />}
      {base === 'login' && <Profile onNavigate={navigate} onUserChange={u=>setUser(u)} />}

  <footer style={{marginTop:'auto', padding:24, background:'linear-gradient(180deg,#000000 0%, #08140C 28%, #0B2B17 58%, #126B36 100%)', color:'white'}}>
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
