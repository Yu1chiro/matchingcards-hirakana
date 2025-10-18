require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // Untuk parse body JSON dari request API
app.use(express.urlencoded({ extended: true })); // Untuk parse body dari form login
app.use(cookieParser());

// =================================================================
// AUTHENTICATION
// =================================================================

// Middleware untuk memeriksa apakah user sudah login
const requireAuth = (req, res, next) => {
    const token = req.cookies.authToken;
    if (token && token === 'authenticated_user_token') { // Token sederhana untuk contoh ini
        next();
    } else {
        res.redirect('/login');
    }
};

// --- AUTH ROUTES ---
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/auth', 'login.html')));
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.cookie('authToken', 'authenticated_user_token', { httpOnly: true, maxAge: 5 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' });
        res.redirect('/dashboard');
    } else {
        res.status(401).send('Username atau password salah. <a href="/login">Coba lagi</a>');
    }
});
app.get('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.redirect('/login');
});

// --- PUBLIC & DYNAMIC ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/game/:category', (req, res) => res.sendFile(path.join(__dirname, 'public', 'game.html')));
app.get('/quiz/:category', (req, res) => res.sendFile(path.join(__dirname, 'public', 'quiz.html')));
app.get('/dashboard', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard', 'dashboard.html')));

// ===============================================
// API ENDPOINTS
// ===============================================

// --- PUBLIC API (for index.html) ---
app.get('/api/topics', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT title, category_slug, description, thumbnail_url FROM topics ORDER BY created_at ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// --- ADMIN TOPIC API ---
app.get('/api/admin/topics', requireAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM topics ORDER BY created_at DESC');
    res.json(rows);
});
app.post('/api/admin/topics', requireAuth, async (req, res) => {
    const { title, category_slug, description, thumbnail_url } = req.body;
    const { rows } = await pool.query('INSERT INTO topics (title, category_slug, description, thumbnail_url) VALUES ($1, $2, $3, $4) RETURNING *', [title, category_slug.toLowerCase(), description, thumbnail_url]);
    res.status(201).json(rows[0]);
});
app.put('/api/admin/topics/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { title, category_slug, description, thumbnail_url } = req.body;
    const { rows } = await pool.query('UPDATE topics SET title=$1, category_slug=$2, description=$3, thumbnail_url=$4 WHERE id=$5 RETURNING *', [title, category_slug.toLowerCase(), description, thumbnail_url, id]);
    res.json(rows[0]);
});
app.delete('/api/admin/topics/:id', requireAuth, async (req, res) => {
    await pool.query('DELETE FROM topics WHERE id = $1', [req.params.id]);
    res.json({ message: 'Topik berhasil dihapus' });
});

// --- KOTOBA API (Unchanged, but now filters by category_slug) ---
app.get('/api/kotoba/:category', async (req, res) => {
    const { rows } = await pool.query('SELECT id, image_url, word_url FROM kotoba WHERE category_slug = $1 ORDER BY id', [req.params.category]);
    res.json(rows);
});
app.get('/api/admin/kotoba/:category_slug', requireAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM kotoba WHERE category_slug = $1 ORDER BY id', [req.params.category_slug]);
    res.json(rows);
});
app.post('/api/admin/kotoba', requireAuth, async (req, res) => {
    const { category_slug, image_url, word_url } = req.body;
    const { rows } = await pool.query('INSERT INTO kotoba (category_slug, image_url, word_url) VALUES ($1, $2, $3) RETURNING *', [category_slug, image_url, word_url]);
    res.status(201).json(rows[0]);
});
app.delete('/api/admin/kotoba/:id', requireAuth, async (req, res) => {
    await pool.query('DELETE FROM kotoba WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kartu Kotoba berhasil dihapus' });
});

// --- QUIZ API (Unchanged, but now filters by category_slug) ---
app.get('/api/quiz/:category', async (req, res) => {
    const { rows } = await pool.query('SELECT question, image_url, option_a, option_b, option_c, option_d, correct_answer FROM quizzes WHERE category_slug = $1 ORDER BY RANDOM()', [req.params.category]);
    res.json(rows);
});
app.get('/api/admin/quizzes/:category_slug', requireAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM quizzes WHERE category_slug = $1 ORDER BY id', [req.params.category_slug]);
    res.json(rows);
});
app.post('/api/admin/quizzes', requireAuth, async (req, res) => {
    const { category_slug, question, image_url, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    const { rows } = await pool.query('INSERT INTO quizzes (category_slug, question, image_url, option_a, option_b, option_c, option_d, correct_answer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [category_slug, question, image_url || null, option_a, option_b, option_c, option_d, correct_answer]);
    res.status(201).json(rows[0]);
});
app.delete('/api/admin/quizzes/:id', requireAuth, async (req, res) => {
    await pool.query('DELETE FROM quizzes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Soal Kuis berhasil dihapus' });
});

// --- ERROR HANDLERS ---
app.use((req, res) => res.status(404).send(`<h1>404</h1>`));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Terjadi kesalahan pada server!');
});

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));