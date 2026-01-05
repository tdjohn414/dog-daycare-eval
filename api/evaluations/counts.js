import pool, { checkAuth, cors } from '../_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await pool.query('SELECT eval_date, COUNT(*) as count FROM evaluations GROUP BY eval_date HAVING COUNT(*) >= 3');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
