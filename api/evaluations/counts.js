import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No auth' });
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (creds[0] !== 'admin' || creds[1] !== 'Barking1') return res.status(401).json({ error: 'Bad auth' });

  try {
    const r = await pool.query('SELECT TO_CHAR(eval_date, \'YYYY-MM-DD\') as eval_date, COUNT(*)::int as count FROM evaluations GROUP BY eval_date HAVING COUNT(*) >= 3');
    return res.status(200).json(r.rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}