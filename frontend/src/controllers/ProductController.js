import ProductModel from '../models/ProductModel'
import { api } from '../lib/api'

export default {
  async list(){
    try{
      const data = await api.get('/api/products')
      if(Array.isArray(data)){
        // mirror into local store so CartController can resolve products by id
        ProductModel.setAll(data)
        return data
      }
      return ProductModel.fetchAll()
    }catch{ return ProductModel.fetchAll() }
  },
  async categories(){
    try{
      const list = await this.list()
      return Array.from(new Set(list.map(p => p.category)))
    }catch{ return ProductModel.categories() }
  },
  async search(q){
    try{
      const list = await this.list()
      const s = (q||'').toLowerCase()
      if(!s) return list
      return list.filter(p =>
        String(p.title).toLowerCase().includes(s) ||
        String(p.description||'').toLowerCase().includes(s) ||
        String(p.category||'').toLowerCase().includes(s)
      )
    }catch{ return ProductModel.search(q) }
  },
  async get(id){
    try{
      const data = await api.get('/api/products/' + id)
      return data || ProductModel.findById(id)
    }catch{ return ProductModel.findById(id) }
  },
  async create(payload){
    // payload can include {title, price, stock, description, category_id|category_name}
    return api.post('/api/products', payload)
  },
  async update(id, payload){
    // Use fetch directly to support PUT via our api wrapper semantics
    const res = await fetch((localStorage.getItem('rb_api_base')||'http://localhost:8000') + '/api/products/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if(!res.ok) throw new Error('Falha ao atualizar produto')
    return res.json().catch(()=>({ok:true}))
  },
  async remove(id){
    const res = await fetch((localStorage.getItem('rb_api_base')||'http://localhost:8000') + '/api/products/' + id, { method: 'DELETE' })
    if(!res.ok) throw new Error('Falha ao excluir produto')
    return res.json().catch(()=>({ok:true}))
  }
}
