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

  const auth = () => ({ Authorization: `Basic ${btoa(user + ':' + pass)}`, 'Content-Type': 'application/json' })

  const login = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
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
    } catch (err) {
      setMsg('Connection error')
    }
  }

  const load = async () => {
    try {
      const [e, b] = await Promise.all([
        fetch('/api/evaluations', { headers: auth() }).then(r => r.json()),
        fetch('/api/evaluations/counts', { headers: auth() }).then(r => r.json())
      ])
      setEvals(e)
      setBlocked(b.map(x => x.eval_date.split('T')[0]))
    } catch (err) {
      console.error(err)
    }
  }

  const add = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
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
        setMsg(data.error)
      }
    } catch (err) {
      setMsg('Error adding')
    }
  }

  const del = async (id) => {
    await fetch(`/api/evaluations/${id}`, { method: 'DELETE', headers: auth() })
    load()
  }

  const fmt = (d) => new Date(d).toLocaleDateString()
  const spots = (d) => 3 - evals.filter(e => e.eval_date.split('T')[0] === d).length

  if (!loggedIn) return (
    <div className="login">
      <h1>🐕 Dog Daycare Evaluations</h1>
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
      <header><h1>🐕 Dog Daycare Evaluations</h1><button onClick={() => setLoggedIn(false)}>Logout</button></header>
      <section>
        <h2>Schedule Evaluation</h2>
        <form onSubmit={add}>
          <input placeholder="Dog Name" value={dogName} onChange={e => setDogName(e.target.value)} required />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
          {date && <small className={blocked.includes(date) ? 'red' : 'green'}>{blocked.includes(date) ? 'FULL' : `${spots(date)} spots left`}</small>}
          <button type="submit" disabled={blocked.includes(date)}>Add</button>
        </form>
        {msg && <p>{msg}</p>}
      </section>
      <section>
        <h2>Scheduled ({evals.length})</h2>
        {evals.map(e => (
          <div key={e.id} className="card">
            <span>🐕 {e.dog_name} - {fmt(e.eval_date)}</span>
            <button onClick={() => del(e.id)}>✕</button>
          </div>
        ))}
      </section>
    </div>
  )
}
