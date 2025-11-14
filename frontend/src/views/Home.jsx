import React, {useEffect, useState} from 'react'
import ProductController from '../controllers/ProductController'
import ProductCard from './ProductCard'

export default function Home({ onNavigate, onAdd }){
  const [featured, setFeatured] = useState([])
  useEffect(()=>{
    let alive = true
    ProductController.list().then(list => { if(alive) setFeatured(list.slice(0,3)) }).catch(()=> setFeatured([]))
    return ()=>{ alive=false }
  }, [])
  return (
    <div className="container" style={{paddingTop:24}}>
      <section className="hero">
        <div className="hero-card" style={{display:'flex', gap:24, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap'}}>
          <div style={{flex:'1 1 520px'}}>
            <h1 style={{margin:'8px 0 0 0'}}>Raiz Brasil — estilo de quem cultiva</h1>
            <p className="muted">Camisetas resistentes e confortáveis, com a cara do agro brasileiro. Verde e amarelo, raiz de verdade.</p>
            <div style={{marginTop:12, display:'flex', gap:12}}>
              <button className="btn text-white" onClick={() => onNavigate('products')}>Ver produtos</button>
              <button className="btn-secondary" onClick={() => onNavigate('auth')}>Entrar / Registrar</button>
            </div>
          </div>
          <div style={{width:360}} className="center">
            <img src="/LOgoRaizBrasil.jpg" alt="Raiz Brasil" style={{maxWidth:300, borderRadius:16}} />
          </div>
        </div>
      </section>

      <section style={{marginTop:24, marginBottom:44}}>
        <h3>Lançamentos</h3>
        <div className="grid products-grid tall-cards" style={{marginTop:12}}>
          {featured.map(p => (
            <ProductCard key={p.id} product={p} onView={onNavigate} onAdd={onAdd} />
          ))}
        </div>
      </section>
    </div>
  )
}
