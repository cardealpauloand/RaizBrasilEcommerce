import { api } from '../lib/api.js'

// Cache configuration
const KEY = 'rb_products_cache'
const TTL_KEY = 'rb_products_ttl'
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

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

// Check if cache is still valid
function isCacheValid() {
  try {
    const ttl = localStorage.getItem(TTL_KEY)
    if (!ttl) return false
    return Date.now() < parseInt(ttl)
  } catch {
    return false
  }
}

// Get products from cache or backend
export default {
  async fetchAll() {
    // Try cache first
    if (isCacheValid()) {
      try {
        const cached = localStorage.getItem(KEY)
        if (cached) {
          return JSON.parse(cached)
        }
      } catch {
        // Cache corrupted, proceed to fetch from backend
      }
    }

    // Fetch from backend
    try {
      const data = await api.get('/api/products')
      if (Array.isArray(data)) {
        // Update cache
        localStorage.setItem(KEY, JSON.stringify(data))
        localStorage.setItem(TTL_KEY, String(Date.now() + CACHE_TTL))
        return data
      }
    } catch (err) {
      console.warn('Failed to fetch products from backend:', err.message)
    }

    // Fallback: use local cache or sample data
    try {
      const cached = localStorage.getItem(KEY)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch {
      // Cache corrupted
    }

    // Last resort: return sample products
    localStorage.setItem(KEY, JSON.stringify(SAMPLE_PRODUCTS))
    localStorage.setItem(TTL_KEY, String(Date.now() + CACHE_TTL))
    return SAMPLE_PRODUCTS
  },

  setAll(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list))
      localStorage.setItem(TTL_KEY, String(Date.now() + CACHE_TTL))
    } catch {}
  },

  findById(id) {
    try {
      const all = this.fetchAllSync() // Use sync version for finding by ID
      return all.find(p => p.id === id)
    } catch {
      return null
    }
  },

  // Sync version for immediate lookups (uses cache without refetching)
  fetchAllSync() {
    try {
      const cached = localStorage.getItem(KEY)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch {
      // Corrupted cache
    }
    // Return sample products as fallback
    return SAMPLE_PRODUCTS
  },

  search(q) {
    const all = this.fetchAllSync()
    if (!q) return all
    const s = q.toLowerCase()
    return all.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.description.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s)
    )
  },

  categories() {
    const all = this.fetchAllSync()
    return Array.from(new Set(all.map(p => p.category)))
  },

  // Clear cache and refresh
  async clearCache() {
    localStorage.removeItem(KEY)
    localStorage.removeItem(TTL_KEY)
    return await this.fetchAll()
  }
}
