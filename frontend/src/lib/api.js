// Simple API client with fallback base URL
const DEFAULT_BASE = 'http://localhost:8000'

function base(){
  try{
    // Priority: Vite env, then localStorage override, then default
    const vite = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
    const stored = localStorage.getItem('rb_api_base')
    return (vite && String(vite).trim()) || stored || DEFAULT_BASE
  }catch{ return DEFAULT_BASE }
}

async function request(path, { method='GET', body, headers }={}){
  const url = base() + path
  const opts = { method, headers: { 'Content-Type':'application/json', ...(headers||{}) } }
  if(body !== undefined) opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  const ctrl = new AbortController()
  const t = setTimeout(()=> ctrl.abort(), 8000)
  try{
    const res = await fetch(url, { ...opts, signal: ctrl.signal })
    const txt = await res.text()
    let data
    try{ data = txt ? JSON.parse(txt) : null }catch{ data = txt }
    if(!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`)
    return data
  } finally {
    clearTimeout(t)
  }
}

export const api = {
  get: (p)=> request(p, { method:'GET' }),
  post: (p, body)=> request(p, { method:'POST', body })
}

export const API_BASE = { get: base }
