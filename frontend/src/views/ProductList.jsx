import React, {useState, useEffect} from 'react'
import ProductController from '../controllers/ProductController'
import ProductCard from './ProductCard'

export default function ProductList({ onNavigate, onAdd }){
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(()=>{
    let alive = true
    ProductController.list().then(set=>{ if(alive) setProducts(set) })
    ProductController.categories().then(c=>{ if(alive) setCategories(c) })
    return ()=>{ alive=false }
  }, [])

  function handleSearch(q){
    setQuery(q)
    ProductController.search(q).then(res=>{
      setProducts(res.filter(p => !category || p.category === category))
    })
  }

  function handleCategory(c){
    setCategory(c)
    ProductController.search(query).then(res=>{
      setProducts(res.filter(p => !c || p.category === c))
    })
  }

  return (
    <div className="container" style={{paddingTop:44}}>
      <div style={{display:'flex', justifyContent:'space-between', gap:16, alignItems:'center', flexWrap:'wrap'}}>
        <div style={{flex:'1 1 320px'}}>
          <input placeholder="Pesquisar produtos, descrição, categoria" value={query} onChange={e=>handleSearch(e.target.value)} style={{width:'100%'}} />
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div className="muted">Categoria:</div>
          <select value={category} onChange={e=>handleCategory(e.target.value)}>
            <option value="">Todas</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{marginTop:18, marginBottom:56}} className="grid products-grid tall-cards">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onView={onNavigate} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}
