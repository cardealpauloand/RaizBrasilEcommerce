import React, { useState } from 'react'
import AuthController from '../controllers/AuthController'

// AuthHub: Centraliza fluxo de login e registro com UX aprimorada
// TODO: Migrar para backend real (tokens JWT, hashing de senha) - localStorage é apenas demonstrativo.
// TODO: Adicionar recuperação de senha futura.
export default function AuthHub({ onNavigate, onUserChange }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [login, setLogin] = useState({ email: '', password: '', remember: true })
  const [reg, setReg] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  // Removidos: nota de segurança e modal de roadmap conforme solicitação

  function scorePassword(p){
    const s = String(p || '')
    let score = 0
    if(s.length >= 6) score += 1
    if(s.length >= 10) score += 1
    if(/[A-Z]/.test(s)) score += 1
    if(/[a-z]/.test(s)) score += 1
    if(/\d/.test(s) && /[^A-Za-z0-9]/.test(s)) score += 1
    return Math.min(score, 5)
  }
  function strengthMeta(p){
    const score = scorePassword(p)
    if(score <= 2) return { label:'Fraca', color:'#ff6b6b', width:'25%' }
    if(score === 3) return { label:'Média', color:'#f4a261', width:'60%' }
    return { label:'Forte', color:'#2a9d8f', width:'100%' }
  }

  function validateEmail(email){ return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) }
  function validatePassword(pw){ return typeof pw === 'string' && pw.length >= 6 }
  function validateName(name){ return /^[A-Za-zÀ-ÿ\s]{2,}$/.test(name) }

  async function run(action, fn){
    setLoading(true); setError(null); setSuccess(null)
    try {
      const user = await fn()
      onUserChange && onUserChange(user)
      onNavigate('profile')
    } catch (err){ setError(err.message) }
    finally { setLoading(false) }
  }

  async function submitLogin(e){
    e.preventDefault()
    if(!validateEmail(login.email)) return setError('Email inválido')
    if(!validatePassword(login.password)) return setError('Senha deve ter 6+ caracteres')
    await run('Login', () => AuthController.login(login))
  }

  async function submitRegister(e){
    e.preventDefault()
    if(!validateName(reg.name)) return setError('Nome inválido (2+ letras)')
    if(!validateEmail(reg.email)) return setError('Email inválido')
    if(!validatePassword(reg.password)) return setError('Senha deve ter 6+ caracteres')
    await run('Registro', () => AuthController.register(reg))
  }

  const current = AuthController.current()
  if(current){
    return (
      <div className="container" style={{ paddingTop: 28, maxWidth: 900 }}>
        <div className="panel" style={{display:'grid', gap:16}}>
          <h2 style={{margin:0}}>Você já está logado</h2>
          <div className="muted" style={{fontSize:14}}>Conta: {current.name} ({current.email})</div>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <button className="btn" onClick={()=> onNavigate('profile')}>Ir para Perfil</button>
            <button className="btn-secondary" onClick={()=> onNavigate('home')}>Voltar à Home</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 28, maxWidth: 900 }}>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Sua conta Raiz Brasil</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={mode==='login' ? 'btn' : 'btn-secondary'} onClick={()=>{ setMode('login'); setError(null); setSuccess(null) }}>Entrar</button>
            <button className={mode==='register' ? 'btn' : 'btn-secondary'} onClick={()=>{ setMode('register'); setError(null); setSuccess(null) }}>Registrar</button>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 14 }}>Acesse para acompanhar pedidos, salvar endereço e muito mais.</div>

        {error && <div className="chip" style={{ borderColor: '#ff6b6b' }}>{error}</div>}
  {success && <div className="chip success">{success}</div>}

        {mode === 'login' && (
          <form onSubmit={submitLogin} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
            <label style={{ display:'grid', gap:4 }}>
              <span className="muted" style={{ fontSize: 12 }}>Email</span>
              <input autoComplete="email" value={login.email} onChange={e=>{ setLogin({ ...login, email:e.target.value }); setError(null) }} placeholder="voce@exemplo.com" />
            </label>
            <label style={{ display:'grid', gap:4 }}>
              <span className="muted" style={{ fontSize: 12 }}>Senha</span>
              <div style={{ position:'relative' }}>
                <input autoComplete="current-password" type={showPass ? 'text':'password'} value={login.password} onChange={e=>{ setLogin({ ...login, password:e.target.value }); setError(null) }} placeholder="••••••" />
                <button type="button" onClick={()=> setShowPass(x=>!x)} style={{ position:'absolute', right:6, top:6, fontSize:12 }} className="btn-secondary">{showPass ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <input type="checkbox" checked={login.remember} onChange={e=> setLogin({ ...login, remember: e.target.checked })} /> Manter conectado
            </label>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Autenticando...' : 'Entrar'}</button>
              <div className="muted" style={{ fontSize:12 }}>Admin: admin@raiz.com / admin123</div>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={submitRegister} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
            <label style={{ display:'grid', gap:4 }}>
              <span className="muted" style={{ fontSize: 12 }}>Nome</span>
              <input autoComplete="name" value={reg.name} onChange={e=>{ setReg({ ...reg, name:e.target.value }); setError(null) }} placeholder="Seu nome" />
            </label>
            <label style={{ display:'grid', gap:4 }}>
              <span className="muted" style={{ fontSize: 12 }}>Email</span>
              <input autoComplete="email" value={reg.email} onChange={e=>{ setReg({ ...reg, email:e.target.value }); setError(null) }} placeholder="voce@exemplo.com" />
            </label>
            <label style={{ display:'grid', gap:4 }}>
              <span className="muted" style={{ fontSize: 12 }}>Senha (mín 6)</span>
              <div style={{ position:'relative' }}>
                <input autoComplete="new-password" type={showPass ? 'text':'password'} value={reg.password} onChange={e=>{ setReg({ ...reg, password:e.target.value }); setError(null) }} placeholder="••••••" />
                <button type="button" onClick={()=> setShowPass(x=>!x)} style={{ position:'absolute', right:6, top:6, fontSize:12 }} className="btn-secondary">{showPass ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </label>
            {/* Password strength meter */}
            {reg.password && (()=>{
              const { label, color, width } = strengthMeta(reg.password)
              return (
                <div style={{display:'grid', gap:6}}>
                  <div style={{height:8, background:'rgba(255,255,255,0.12)', borderRadius:6, overflow:'hidden'}}>
                    <div style={{height:'100%', width, background:color, transition:'width .25s ease'}} />
                  </div>
                  <div className="muted" style={{fontSize:12}}>Força da senha: <span style={{color}}>{label}</span></div>
                </div>
              )
            })()}
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Criar conta'}</button>
              <div className="muted" style={{ fontSize:12 }}>Ao criar você aceita os termos.</div>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
