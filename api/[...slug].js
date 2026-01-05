import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table on first run
pool.query(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    dog_name VARCHAR(255) NOT NULL,
    eval_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(console.error);

function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  return creds[0] === 'admin' && creds[1] === 'Barking1';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = [].concat(req.query.slug || []).join('/');

  try {
    if (req.method === 'POST' && path === 'login') {
      const { username, password } = req.body;
      if (username === 'admin' && password === 'Barking1') return res.json({ success: true });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET' && path === 'evaluations') {
      const result = await pool.query('SELECT * FROM evaluations ORDER BY eval_date DESC');
      return res.json(result.rows);
    }

    if (req.method === 'GET' && path === 'evaluations/counts') {
      const result = await pool.query('SELECT eval_date, COUNT(*) as count FROM evaluations GROUP BY eval_date HAVING COUNT(*) >= 3');
      return res.json(result.rows);
    }

    if (req.method === 'POST' && path === 'evaluations') {
      const { dog_name, eval_date } = req.body;
      const count = await pool.query('SELECT COUNT(*) FROM evaluations WHERE eval_date = $1', [eval_date]);
      if (parseInt(count.rows[0].count) >= 3) return res.status(400).json({ error: 'Date fully booked' });
      const result = await pool.query('INSERT INTO evaluations (dog_name, eval_date) VALUES ($1, $2) RETURNING *', [dog_name, eval_date]);
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE' && path.startsWith('evaluations/')) {
      const id = path.split('/')[1];
      await pool.query('DELETE FROM evaluations WHERE id = $1', [id]);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
