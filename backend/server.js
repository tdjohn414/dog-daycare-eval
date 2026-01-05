require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// Hardcoded credentials
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'Barking1';

// Simple auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Get all evaluations
app.get('/api/evaluations', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM evaluations ORDER BY eval_date DESC, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Get evaluations count by date (for blocking)
app.get('/api/evaluations/counts', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT eval_date, COUNT(*) as count 
      FROM evaluations 
      GROUP BY eval_date 
      HAVING COUNT(*) >= 3
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
});

// Get count for specific date
app.get('/api/evaluations/count/:date', authenticate, async (req, res) => {
  try {
    const { date } = req.params;
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM evaluations WHERE eval_date = $1',
      [date]
    );
    res.json({ date, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching count:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// Create evaluation
app.post('/api/evaluations', authenticate, async (req, res) => {
  try {
    const { dog_name, eval_date } = req.body;
    
    if (!dog_name || !eval_date) {
      return res.status(400).json({ error: 'Dog name and date are required' });
    }
    
    // Check if date already has 3 evaluations
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM evaluations WHERE eval_date = $1',
      [eval_date]
    );
    
    if (parseInt(countResult.rows[0].count) >= 3) {
      return res.status(400).json({ error: 'This date already has 3 evaluations scheduled' });
    }
    
    const result = await pool.query(
      'INSERT INTO evaluations (dog_name, eval_date) VALUES ($1, $2) RETURNING *',
      [dog_name, eval_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
});

// Delete evaluation
app.delete('/api/evaluations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM evaluations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Failed to delete evaluation' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database table
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        dog_name VARCHAR(255) NOT NULL,
        eval_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

app.listen(PORT, async () => {
  await initDB();
  console.log(`Server running on port ${PORT}`);
});
