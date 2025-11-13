// Simple UserModel with localStorage-based users and current user persistence
const KEY_USERS = 'rb_users_v1'
const KEY_CURRENT = 'rb_current_user'

const defaultUsers = [
  { id: 'u_admin', name: 'Admin Raiz', email: 'admin@raiz.com', password: 'admin123', isAdmin: true, phone: '', address: '', street:'', number:'', complement:'', city: '', state: '', zip: '' },
  { id: 'u_user', name: 'Cliente', email: 'cliente@raiz.com', password: 'client123', isAdmin: false, phone: '', address: '', street:'', number:'', complement:'', city: '', state: '', zip: '' }
]

function ensure(){
  if(!localStorage.getItem(KEY_USERS)) localStorage.setItem(KEY_USERS, JSON.stringify(defaultUsers))
}

export default {
  list(){ ensure(); return JSON.parse(localStorage.getItem(KEY_USERS)) },
  create({name,email,password}){
    ensure()
    const users = this.list()
    const exists = users.find(u=>u.email === email)
    if(exists) throw new Error('Usuário já existe')
  const user = { id: 'u_' + Date.now(), name, email, password, isAdmin:false, phone:'', address:'', street:'', number:'', complement:'', city:'', state:'', zip:'' }
    users.push(user)
    localStorage.setItem(KEY_USERS, JSON.stringify(users))
    localStorage.setItem(KEY_CURRENT, JSON.stringify(user))
    return user
  },
  login({email,password}){
    ensure()
    const u = this.list().find(x => x.email === email && x.password === password)
    if(!u) throw new Error('Credenciais inválidas')
    localStorage.setItem(KEY_CURRENT, JSON.stringify(u))
    return u
  },
  logout(){ localStorage.removeItem(KEY_CURRENT) },
  current(){ return JSON.parse(localStorage.getItem(KEY_CURRENT)) },
  ensureAdmin(){
    const cur = this.current()
    return cur && cur.isAdmin
  },
  updateCurrent(patch){
    ensure()
    const cur = this.current()
    if(!cur) throw new Error('Nenhum usuário logado')
    const updated = { ...cur, ...patch }
    // persist in users list
    const users = this.list().map(u => u.id === cur.id ? updated : u)
    localStorage.setItem(KEY_USERS, JSON.stringify(users))
    localStorage.setItem(KEY_CURRENT, JSON.stringify(updated))
    return updated
  }
}
