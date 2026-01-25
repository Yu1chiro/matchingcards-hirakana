require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const ImageKit = require("imagekit"); 

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Helper Function untuk Upload ke ImageKit
async function uploadImage(base64String, fileName, folderName) {
    if (!base64String || base64String.startsWith('http')) return base64String;
    try {
        const response = await imagekit.upload({
            file: base64String, // base64 string
            fileName: fileName,
            folder: folderName,
            useUniqueFileName: true
        });
        return response.url;
    } catch (error) {
        console.error("ImageKit Upload Error:", error);
        throw new Error("Gagal mengunggah gambar ke cloud.");
    }
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(express.static(path.join(__dirname, "public")));
// Tingkatkan limit JSON untuk menangani base64 yang besar
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// =================================================================
// AUTHENTICATION
// =================================================================
const requireAuth = (req, res, next) => {
    const token = req.cookies.authToken;
    if (token && token === 'authenticated_user_token') {
        next();
    } else {
        res.redirect('/login');
    }
};

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
    try {
        let { title, category_slug, description, thumbnail_url } = req.body;
        // Upload thumbnail jika ada base64
        const uploadedUrl = await uploadImage(thumbnail_url, `thumb_${category_slug}`, "/topics");
        const { rows } = await pool.query('INSERT INTO topics (title, category_slug, description, thumbnail_url) VALUES ($1, $2, $3, $4) RETURNING *', [title, category_slug.toLowerCase(), description, uploadedUrl]);
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/topics/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        let { title, category_slug, description, thumbnail_url } = req.body;
        const uploadedUrl = await uploadImage(thumbnail_url, `thumb_${category_slug}`, "/topics");
        const { rows } = await pool.query('UPDATE topics SET title=$1, category_slug=$2, description=$3, thumbnail_url=$4 WHERE id=$5 RETURNING *', [title, category_slug.toLowerCase(), description, uploadedUrl, id]);
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/topics/:id', requireAuth, async (req, res) => {
    await pool.query('DELETE FROM topics WHERE id = $1', [req.params.id]);
    res.json({ message: 'Topik berhasil dihapus' });
});

// --- KOTOBA API ---
app.get('/api/kotoba/:category', async (req, res) => {
    const { rows } = await pool.query('SELECT id, image_url, word_url FROM kotoba WHERE category_slug = $1 ORDER BY id', [req.params.category]);
    res.json(rows);
});

app.get('/api/admin/kotoba/:category_slug', requireAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM kotoba WHERE category_slug = $1 ORDER BY id', [req.params.category_slug]);
    res.json(rows);
});

app.post('/api/admin/kotoba', requireAuth, async (req, res) => {
    try {
        let { category_slug, image_url, word_url } = req.body;
        const uploadedImageUrl = await uploadImage(image_url, `img_${Date.now()}`, `/kotoba/${category_slug}`);
        const uploadedWordUrl = await uploadImage(word_url, `word_${Date.now()}`, `/kotoba/${category_slug}`);
        const { rows } = await pool.query('INSERT INTO kotoba (category_slug, image_url, word_url) VALUES ($1, $2, $3) RETURNING *', [category_slug, uploadedImageUrl, uploadedWordUrl]);
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/kotoba/:id', requireAuth, async (req, res) => {
    await pool.query('DELETE FROM kotoba WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kartu Kotoba berhasil dihapus' });
});

// --- QUIZ API ---
app.get('/api/quiz/:category', async (req, res) => {
    const { rows } = await pool.query('SELECT question, image_url, option_a, option_b, option_c, option_d, correct_answer FROM quizzes WHERE category_slug = $1 ORDER BY RANDOM()', [req.params.category]);
    res.json(rows);
});

app.get('/api/admin/quizzes/:category_slug', requireAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM quizzes WHERE category_slug = $1 ORDER BY id', [req.params.category_slug]);
    res.json(rows);
});

app.post('/api/admin/quizzes', requireAuth, async (req, res) => {
    try {
        let { category_slug, question, image_url, option_a, option_b, option_c, option_d, correct_answer } = req.body;
        const uploadedImageUrl = await uploadImage(image_url, `quiz_${Date.now()}`, `/quizzes/${category_slug}`);
        const { rows } = await pool.query('INSERT INTO quizzes (category_slug, question, image_url, option_a, option_b, option_c, option_d, correct_answer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [category_slug, question, uploadedImageUrl || null, option_a, option_b, option_c, option_d, correct_answer]);
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/quizzes/:id', requireAuth, async (req, res) => {
    await pool.query('DELETE FROM quizzes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Soal Kuis berhasil dihapus' });
});

app.use((req, res) => res.status(404).send(`<h1>404</h1>`));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Terjadi kesalahan pada server!');
});

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));