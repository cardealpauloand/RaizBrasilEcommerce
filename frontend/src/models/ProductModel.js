// ProductModel - holds initial product data and persistence
const KEY = 'rb_products_v7'
const SAMPLE_PRODUCTS = [
  {
    id: 'p1',
    title: 'Camiseta Raiz Brasil Agrícola',
    price: 139.9,
    category: 'Masculina',
    description: 'Tecido premium, ideal para o dia a dia no campo. Estampa agrícola exclusiva.',
    images: ['/RaizBrasilAgricolaFrente.jpg','/RaizBrasilAgricolaCostas.jpg']
  },
  {
    id: 'p2',
    title: 'Camiseta Raiz Brasil Azul',
    price: 139.9,
    category: 'Masculina',
    description: 'Conforto e estilo em tom azul. Perfeita para feiras e eventos.',
    images: ['/RaizBrasilAzulFrente.jpg','/RaizBrasilAzulCostas.jpg']
  },
  {
    id: 'p3',
    title: 'Camiseta Raiz Brasil Azul & Cinza',
    price: 139.9,
    category: 'Masculina',
    description: 'Combinação moderna de azul e cinza, com a força do agro.',
    images: ['/RaizBrasilAzulECinzaFrente.jpg','/RaizBrasilAzulECinzaCostas.jpg']
  }
]

export default {
  fetchAll(){
    // In a real app we'd call backend. Here we persist to localStorage for demo
    const stored = localStorage.getItem(KEY)
    if(stored){
      try { return JSON.parse(stored) } catch { /* fallthrough to reseed */ }
    }
    // clean old keys to avoid confusion
    ;['rb_products_v1','rb_products_v2','rb_products_v3','rb_products_v4','rb_products_v5'].forEach(k=> localStorage.removeItem(k))
    localStorage.setItem(KEY, JSON.stringify(SAMPLE_PRODUCTS))
    return SAMPLE_PRODUCTS
  },
  setAll(list){
    try{ localStorage.setItem(KEY, JSON.stringify(list)) }catch{}
  },
  findById(id){
    const all = this.fetchAll()
    return all.find(p => p.id === id)
  },
  search(q){
    const all = this.fetchAll()
    if(!q) return all
    const s = q.toLowerCase()
    return all.filter(p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.category.toLowerCase().includes(s))
  },
  categories(){
    const all = this.fetchAll()
    return Array.from(new Set(all.map(p => p.category)))
  }
}
