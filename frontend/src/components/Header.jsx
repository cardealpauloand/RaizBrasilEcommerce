import React from 'react'
import AuthController from '../controllers/AuthController'
import CartController from '../controllers/CartController'

export default function Header({ onNavigate, cartCount, user, onLogout }){
  return (
    <header className="header">
      <div className="container top">
        <div className="logo" style={{cursor:'pointer'}} onClick={()=>onNavigate('home')}>
          <img src="/LOgoRaizBrasil.jpg" alt="Raiz Brasil" />
          <div>
            <div className="brand">RAIZ BRASIL</div>
            <div style={{fontSize:12}}>Camisetas para agricultores</div>
          </div>
        </div>

        {/* Greeting centered in the header (plain text, no background) */}
        <div className="header-center">
          {user && (()=>{
            const displayName = (user.name && String(user.name).trim()) || (user.email ? String(user.email).split('@')[0] : '')
            return displayName ? <div className="greeting">Olá, {displayName}</div> : null
          })()}
        </div>

        <nav className="nav">
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <button className="btn" onClick={() => onNavigate('products')}>Produtos</button>
            <button className="btn" onClick={() => onNavigate(user ? 'profile' : 'auth')}>{user ? 'Perfil' : 'Entrar'}</button>
            {user && user.isAdmin && <button className="btn" onClick={() => onNavigate('admin')}>Painel Admin</button>}
            <button className="btn" onClick={() => onNavigate('cart')}>Carrinho ({cartCount})</button>
            {user && (
              <button className="btn" onClick={() => { onLogout(); onNavigate('home') }}>Sair</button>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
