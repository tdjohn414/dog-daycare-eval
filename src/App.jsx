import { useState, useEffect } from 'react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [evaluations, setEvaluations] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [dogName, setDogName] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const getAuthHeader = () => {
    const credentials = btoa(`${username}:${password}`)
    return { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      if (res.ok) {
        setIsLoggedIn(true)
        fetchEvaluations()
        fetchBlockedDates()
      } else {
        setLoginError('Invalid username or password')
      }
    } catch (err) {
      setLoginError('Connection error. Please try again.')
    }
  }

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/evaluations', { headers: getAuthHeader() })
      if (res.ok) {
        const data = await res.json()
        setEvaluations(data)
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err)
    }
  }

  const fetchBlockedDates = async () => {
    try {
      const res = await fetch('/api/evaluations/counts', { headers: getAuthHeader() })
      if (res.ok) {
        const data = await res.json()
        setBlockedDates(data.map(d => d.eval_date.split('T')[0]))
      }
    } catch (err) {
      console.error('Error fetching blocked dates:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ dog_name: dogName, eval_date: evalDate })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(`Evaluation scheduled for ${dogName} on ${evalDate}`)
        setDogName('')
        setEvalDate('')
        fetchEvaluations()
        fetchBlockedDates()
      } else {
        setError(data.error || 'Failed to create evaluation')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this evaluation?')) return

    try {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (res.ok) {
        fetchEvaluations()
        fetchBlockedDates()
        setSuccess('Evaluation deleted')
      }
    } catch (err) {
      setError('Failed to delete evaluation')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setEvaluations([])
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getDateCount = (date) => evaluations.filter(e => e.eval_date.split('T')[0] === date).length
  const isDateBlocked = (date) => blockedDates.includes(date)

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🐕 Dog Daycare</h1>
          <h2>Evaluation Tracker</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {loginError && <div className="error">{loginError}</div>}
            <button type="submit" className="btn-primary">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header>
        <h1>🐕 Dog Daycare Evaluations</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </header>

      <main>
        <section className="form-section">
          <h2>Schedule New Evaluation</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Dog Name</label>
                <input type="text" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Enter dog's name" required />
              </div>
              <div className="form-group">
                <label>Evaluation Date</label>
                <input type="date" value={evalDate} onChange={(e) => setEvalDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
                {evalDate && (
                  <small className={isDateBlocked(evalDate) ? 'blocked' : 'available'}>
                    {isDateBlocked(evalDate) ? '❌ Fully booked (3/3)' : `✓ ${3 - getDateCount(evalDate)} spots available`}
                  </small>
                )}
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button type="submit" className="btn-primary" disabled={loading || isDateBlocked(evalDate)}>
              {loading ? 'Scheduling...' : 'Schedule Evaluation'}
            </button>
          </form>
        </section>

        <section className="list-section">
          <h2>Scheduled Evaluations</h2>
          {evaluations.length === 0 ? (
            <p className="empty">No evaluations scheduled yet.</p>
          ) : (
            <div className="eval-list">
              {evaluations.map((e) => (
                <div key={e.id} className="eval-card">
                  <div className="eval-info">
                    <span className="dog-name">🐕 {e.dog_name}</span>
                    <span className="eval-date">{formatDate(e.eval_date)}</span>
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="btn-delete">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="blocked-section">
          <h2>Fully Booked Dates</h2>
          {blockedDates.length === 0 ? (
            <p className="empty">No dates fully booked.</p>
          ) : (
            <div className="blocked-list">
              {blockedDates.map((date) => (
                <span key={date} className="blocked-date">{formatDate(date)}</span>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
