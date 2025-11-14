import React, {useEffect, useState} from 'react'
import ProductController from '../controllers/ProductController'

export default function ProductPage({ id, onAdd }){
  const [p, setP] = useState(null)
  const [current, setCurrent] = useState(0)
  const [size, setSize] = useState('M')
  useEffect(()=>{
    let alive = true
    ProductController.get(id).then(prod=>{ if(alive) setP(prod) }).catch(()=> setP(null))
    return ()=>{ alive=false }
  }, [id])
  if(!p) return <div className="container" style={{paddingTop:20}}>Produto não encontrado</div>
  const imgs = p.images || (p.image ? [p.image] : [])
  return (
    <div className="container" style={{paddingTop:20}}>
      <div style={{display:'flex', gap:18, flexWrap:'wrap'}}>
        <div style={{flex:'1 1 420px'}}>
          <div className="panel" style={{display:'flex', justifyContent:'center'}}>
            <img
              src={imgs[current]}
              alt={p.title}
              className={`product-img ${current%2===1 ? 'flipped' : ''}`}
              style={{width:'100%', maxWidth:420, borderRadius:12, cursor: imgs.length>1 ? 'pointer':'default'}}
              onClick={()=> setCurrent((current + 1) % imgs.length)}
              title="Clique para ver frente/costas"
            />
          </div>
          {imgs.length>1 && (
            <div style={{display:'flex', gap:8, marginTop:8}}>
              {imgs.map((src, i)=> (
                <img key={i} onClick={()=>setCurrent(i)} src={src} style={{height:70, width:70, objectFit:'cover', borderRadius:8, cursor:'pointer', outline: i===current ? '3px solid var(--focus)' : '1px solid rgba(255,255,255,0.12)'}} />
              ))}
            </div>
          )}
        </div>
        <div style={{flex:'1 1 320px'}}>
          <h2 style={{marginTop:0}}>{p.title}</h2>
          <div className="price">R$ {p.price.toFixed(2)}</div>
          <p className="muted">{p.category}</p>
          <p>{p.description}</p>
          <div style={{margin:'12px 0 8px 0'}}>
            <div className="muted" style={{marginBottom:6}}>Tamanho</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {['PP','P','M','G','GG','XGG'].map(t => (
                <button
                  key={t}
                  type="button"
                  className="chip size-chip"
                  onClick={() => setSize(t)}
                  style={{
                    border: size===t ? '2px solid var(--accent-solid)' : '1px solid rgba(255,255,255,0.12)',
                    background: size===t ? 'rgba(255, 221, 87, 0.15)' : 'transparent',
                    fontWeight: size===t ? 700 : 500
                  }}
                >{t}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex', gap:12}}>
            <button className="btn" onClick={() => onAdd(p.id, size)}>Adicionar ao carrinho</button>
          </div>
        </div>
      </div>
    </div>
  )
}
