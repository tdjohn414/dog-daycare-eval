import { useState } from 'react'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [evals, setEvals] = useState([])
  const [blocked, setBlocked] = useState([])
  const [dogName, setDogName] = useState('')
  const [date, setDate] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const auth = () => ({ Authorization: `Basic ${btoa(user + ':' + pass)}`, 'Content-Type': 'application/json' })

  const login = async (e) => {
    e.preventDefault()
    setMsg('')
    const r = await fetch('/api/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ username: user, password: pass }) 
    })
    if (r.ok) { 
      setLoggedIn(true)
      load() 
    } else {
      setMsg('Invalid login')
    }
  }

  const load = async () => {
    setLoading(true)
    const [evalsRes, countsRes] = await Promise.all([
      fetch('/api/evaluations', { headers: auth() }),
      fetch('/api/evaluations/counts', { headers: auth() })
    ])
    const evalsData = await evalsRes.json()
    const countsData = await countsRes.json()
    setEvals(Array.isArray(evalsData) ? evalsData : [])
    setBlocked(Array.isArray(countsData) ? countsData.map(x => parseDate(x.eval_date)) : [])
    setLoading(false)
  }

  // Fix timezone issue - extract just YYYY-MM-DD
  const parseDate = (d) => {
    if (!d) return ''
    return d.split('T')[0]
  }

  const formatDate = (d) => {
    const parsed = parseDate(d)
    if (!parsed) return ''
    const [y, m, day] = parsed.split('-')
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Count how many evals on a specific date
  const countForDate = (d) => {
    return evals.filter(e => parseDate(e.eval_date) === d).length
  }

  const spotsLeft = (d) => 3 - countForDate(d)
  const isFull = (d) => countForDate(d) >= 3

  const add = async (e) => {
    e.preventDefault()
    if (isFull(date)) {
      setMsg('Date is full!')
      return
    }
    setMsg('')
    const r = await fetch('/api/evaluations', { 
      method: 'POST', 
      headers: auth(), 
      body: JSON.stringify({ dog_name: dogName, eval_date: date }) 
    })
    if (r.ok) { 
      setDogName('')
      setDate('')
      setMsg('Added!')
      load() 
    } else {
      const data = await r.json()
      setMsg(data.error || 'Error')
    }
  }

  const del = async (id) => {
    if (!confirm('Delete this evaluation?')) return
    await fetch(`/api/evaluations/${id}`, { method: 'DELETE', headers: auth() })
    load()
  }

  if (!loggedIn) return (
    <div className="login">
      <h1>🐕 Dog Daycare</h1>
      <p>Evaluation Scheduler</p>
      <form onSubmit={login}>
        <input placeholder="Username" value={user} onChange={e => setUser(e.target.value)} />
        <input placeholder="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      {msg && <p className="err">{msg}</p>}
    </div>
  )

  return (
    <div className="app">
      <header>
        <h1>🐕 Dog Daycare Evaluations</h1>
        <button onClick={() => { setLoggedIn(false); setEvals([]); setBlocked([]) }}>Logout</button>
      </header>

      <div className="card">
        <h2>Schedule Evaluation</h2>
        <form onSubmit={add}>
          <input 
            placeholder="Dog Name" 
            value={dogName} 
            onChange={e => setDogName(e.target.value)} 
            required 
          />
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            min={new Date().toISOString().split('T')[0]} 
            required 
          />
          {date && (
            <div className={`spots ${isFull(date) ? 'full' : 'open'}`}>
              {isFull(date) ? '❌ FULL (0 spots)' : `✓ ${spotsLeft(date)} spot${spotsLeft(date) !== 1 ? 's' : ''} available`}
            </div>
          )}
          <button type="submit" disabled={loading || (date && isFull(date))}>
            {loading ? 'Loading...' : 'Schedule'}
          </button>
        </form>
        {msg && <p className={msg === 'Added!' ? 'success' : 'err'}>{msg}</p>}
      </div>

      <div className="card">
        <h2>Scheduled Evaluations ({evals.length})</h2>
        {evals.length === 0 ? (
          <p className="empty">No evaluations scheduled</p>
        ) : (
          <div className="list">
            {evals.map(ev => (
              <div key={ev.id} className="item">
                <div>
                  <strong>🐕 {ev.dog_name}</strong>
                  <span>{formatDate(ev.eval_date)}</span>
                </div>
                <button onClick={() => del(ev.id)} className="del">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}