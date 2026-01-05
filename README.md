# 🐕 Dog Daycare Evaluation Tracker

A simple app to schedule and track dog daycare evaluations. Max 3 evaluations per day.

**Login:** `admin` / `Barking1`

---

## 🚀 SPEEDRUN SETUP GUIDE

### Step 1: GitHub Setup (2 min)

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `dog-daycare-eval`
3. Keep it **Public** or **Private** (your choice)
4. **Don't** initialize with README
5. Click "Create repository"

**Push your code:**
```bash
cd dog-daycare-eval
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dog-daycare-eval.git
git push -u origin main
```

---

### Step 2: Railway Setup - Backend + Database (5 min)

1. Go to [railway.app](https://railway.app) and login
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `dog-daycare-eval` repo
4. Railway will detect the monorepo. Click **"Add Service"** → **"GitHub Repo"** → select same repo

**Configure Backend Service:**
1. Click on the service → **Settings** → **Root Directory** → set to `backend`
2. Go to **Variables** tab → Railway auto-detects Node.js

**Add PostgreSQL:**
1. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Click on your backend service → **Variables**
3. Click **"Add Variable Reference"** → select `DATABASE_URL` from PostgreSQL
4. Add another variable: `NODE_ENV` = `production`

**Get your Backend URL:**
1. Click on backend service → **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://dog-daycare-backend-production.up.railway.app`)

---

### Step 3: Vercel Setup - Frontend (3 min)

1. Go to [vercel.com](https://vercel.com) and login
2. Click **"Add New..."** → **"Project"**
3. Import your `dog-daycare-eval` GitHub repo
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
5. Expand **"Environment Variables"** and add:
   ```
   VITE_API_URL = https://your-railway-backend-url.railway.app
   ```
6. Click **"Deploy"**

---

## 📊 SQL Commands (Auto-runs, but here for reference)

The table is auto-created by the backend, but if you need to manually set up:

```sql
-- Create the evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  dog_name VARCHAR(255) NOT NULL,
  eval_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster date queries
CREATE INDEX idx_eval_date ON evaluations(eval_date);

-- Example: View all evaluations
SELECT * FROM evaluations ORDER BY eval_date DESC;

-- Example: Check counts per date
SELECT eval_date, COUNT(*) as count 
FROM evaluations 
GROUP BY eval_date 
ORDER BY eval_date;

-- Example: Find fully booked dates
SELECT eval_date, COUNT(*) as count 
FROM evaluations 
GROUP BY eval_date 
HAVING COUNT(*) >= 3;
```

**To access Railway PostgreSQL:**
1. Go to Railway dashboard → Click on PostgreSQL service
2. Go to **"Data"** tab to view/edit data
3. Or use **"Connect"** tab to get connection string for external tools

---

## 🔧 Local Development

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local PostgreSQL or Railway DATABASE_URL
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env - set VITE_API_URL=http://localhost:3001 for local dev
npm run dev
```

---

## 📁 Project Structure

```
dog-daycare-eval/
├── backend/
│   ├── server.js        # Express API server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React component
│   │   ├── main.jsx     # Entry point
│   │   └── index.css    # Styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

---

## ✅ Features

- 🔐 Simple login (admin/Barking1)
- 📅 Schedule evaluations by date
- 🚫 Auto-blocks dates with 3 evaluations
- 🗑️ Delete evaluations
- 📱 Mobile responsive
- ⚡ Real-time availability checking

---

## 🆘 Troubleshooting

**CORS errors?**
- Make sure `VITE_API_URL` in Vercel matches your Railway backend URL exactly

**Database connection errors?**
- Check Railway PostgreSQL is running
- Verify `DATABASE_URL` is set in Railway backend variables

**Login not working?**
- Credentials are hardcoded: `admin` / `Barking1`

---

## 🎉 Done!

Your app should now be live at your Vercel URL!
