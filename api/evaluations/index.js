import pool, { checkAuth, cors } from '../_db.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM evaluations ORDER BY eval_date DESC');
      return res.json(result.rows);
    }

    if (req.method === 'POST') {
      const { dog_name, eval_date } = req.body || {};
      if (!dog_name || !eval_date) return res.status(400).json({ error: 'Missing fields' });
      
      const count = await pool.query('SELECT COUNT(*) FROM evaluations WHERE eval_date = $1', [eval_date]);
      if (parseInt(count.rows[0].count) >= 3) return res.status(400).json({ error: 'Date fully booked (max 3)' });
      
      const result = await pool.query('INSERT INTO evaluations (dog_name, eval_date) VALUES ($1, $2) RETURNING *', [dog_name, eval_date]);
      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
