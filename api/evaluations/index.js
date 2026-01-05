import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No auth' });
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (creds[0] !== 'admin' || creds[1] !== 'Barking1') return res.status(401).json({ error: 'Bad auth' });

  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS evaluations (id SERIAL PRIMARY KEY, dog_name VARCHAR(255), eval_date DATE, created_at TIMESTAMP DEFAULT NOW())`);

    if (req.method === 'GET') {
      const r = await pool.query('SELECT id, dog_name, TO_CHAR(eval_date, \'YYYY-MM-DD\') as eval_date, created_at FROM evaluations ORDER BY eval_date DESC');
      return res.status(200).json(r.rows);
    }

    if (req.method === 'POST') {
      const { dog_name, eval_date } = req.body || {};
      if (!dog_name || !eval_date) return res.status(400).json({ error: 'Missing fields' });
      
      const c = await pool.query('SELECT COUNT(*)::int as c FROM evaluations WHERE eval_date = $1', [eval_date]);
      if (c.rows[0].c >= 3) return res.status(400).json({ error: 'Date full (max 3)' });
      
      const r = await pool.query('INSERT INTO evaluations (dog_name, eval_date) VALUES ($1, $2) RETURNING id, dog_name, TO_CHAR(eval_date, \'YYYY-MM-DD\') as eval_date', [dog_name, eval_date]);
      return res.status(201).json(r.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}