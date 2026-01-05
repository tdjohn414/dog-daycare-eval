import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    dog_name VARCHAR(255) NOT NULL,
    eval_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(console.error);

export default pool;

export function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  return creds[0] === 'admin' && creds[1] === 'Barking1';
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
