import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Init table on first request
let initialized = false;
async function initDB() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      dog_name VARCHAR(255) NOT NULL,
      eval_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  initialized = true;
}

// Auth check
function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  return creds[0] === 'admin' && creds[1] === 'Barking1';
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  await initDB();

  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug || '';

  // POST /api/login
  if (req.method === 'POST' && path === 'login') {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Barking1') {
      return res.json({ success: true });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Auth required for everything else
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET /api/evaluations
  if (req.method === 'GET' && path === 'evaluations') {
    const result = await pool.query('SELECT * FROM evaluations ORDER BY eval_date DESC, created_at DESC');
    return res.json(result.rows);
  }

  // GET /api/evaluations/counts
  if (req.method === 'GET' && path === 'evaluations/counts') {
    const result = await pool.query(`
      SELECT eval_date, COUNT(*) as count FROM evaluations GROUP BY eval_date HAVING COUNT(*) >= 3
    `);
    return res.json(result.rows);
  }

  // POST /api/evaluations
  if (req.method === 'POST' && path === 'evaluations') {
    const { dog_name, eval_date } = req.body;
    if (!dog_name || !eval_date) {
      return res.status(400).json({ error: 'Dog name and date required' });
    }
    const countResult = await pool.query('SELECT COUNT(*) FROM evaluations WHERE eval_date = $1', [eval_date]);
    if (parseInt(countResult.rows[0].count) >= 3) {
      return res.status(400).json({ error: 'Date fully booked (3 max)' });
    }
    const result = await pool.query(
      'INSERT INTO evaluations (dog_name, eval_date) VALUES ($1, $2) RETURNING *',
      [dog_name, eval_date]
    );
    return res.status(201).json(result.rows[0]);
  }

  // DELETE /api/evaluations/[id]
  if (req.method === 'DELETE' && path.startsWith('evaluations/')) {
    const id = path.split('/')[1];
    await pool.query('DELETE FROM evaluations WHERE id = $1', [id]);
    return res.json({ success: true });
  }

  return res.status(404).json({ error: 'Not found' });
}
