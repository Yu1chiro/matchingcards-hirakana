require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const ImageKit = require("imagekit");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================
// 1. KONFIGURASI IMAGEKIT & DATABASE
// =========================================

// Pastikan .env sudah benar isinya
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});
// DB & ImageKit ON EMAIL : voidelma@gmail.com
// Cek Koneksi DB saat start
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Database connected successfully!');
    release();
});

// Helper Upload ImageKit
async function uploadImage(base64String, fileName, folderName) {
    if (!base64String || typeof base64String !== 'string') return null;
    if (base64String.startsWith('http')) return base64String; // Jika sudah URL, kembalikan saja

    try {
        const response = await imagekit.upload({
            file: base64String, 
            fileName: fileName,
            folder: folderName,
            useUniqueFileName: true
        });
        console.log(`Image Uploaded: ${fileName}`);
        return response.url;
    } catch (error) {
        console.error("ImageKit Upload Error:", error);
        throw new Error("Gagal upload gambar ke server.");
    }
}

// =========================================
// 2. MIDDLEWARE
// =========================================

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Auth Middleware
const requireAuth = (req, res, next) => {
    const token = req.cookies.authToken;
    if (token && token === 'authenticated_user_token') {
        next();
    } else {
        // Jika request dari API (fetch), kirim JSON 401, jangan redirect HTML
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: "Unauthorized. Please login." });
        }
        res.redirect('/login');
    }
};

// =========================================
// 3. ROUTES HALAMAN (VIEW)
// =========================================

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/auth', 'login.html')));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Ganti sesuai kebutuhan passwordmu
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.cookie('authToken', 'authenticated_user_token', { 
            httpOnly: true, 
            maxAge: 24 * 60 * 60 * 1000 // 1 hari
        });
        res.redirect('/dashboard');
    } else {
        res.status(401).send('Username/Password Salah. <a href="/login">Kembali</a>');
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.redirect('/login');
});

// Public Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/levels', (req, res) => res.sendFile(path.join(__dirname, 'public', 'levels.html')));
app.get('/results', (req, res) => res.sendFile(path.join(__dirname, 'public', 'results.html')));
app.get('/game/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'game.html')));
app.get('/quiz/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'quiz.html')));

// Dashboard (Protected)
app.get('/dashboard', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard', 'dashboard.html')));


// =========================================
// 4. API ENDPOINTS (BACKEND LOGIC)
// =========================================

// --- PUBLIC API ---
// Get Topics untuk halaman depan
app.get('/api/topics', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM topics ORDER BY created_at ASC');
        res.json(rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// Get Levels berdasarkan Topic ID
app.get('/api/topics/:topic_id/levels', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM game_levels WHERE topic_id = $1 ORDER BY level_order ASC', [req.params.topic_id]);
        res.json(rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// Get Konten Game per Level
app.get('/api/kotoba/level/:level_id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM kotoba WHERE level_id = $1 ORDER BY id', [req.params.level_id]);
        res.json(rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// Get Konten Quiz per Level
app.get('/api/quiz/level/:level_id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM quizzes WHERE level_id = $1 ORDER BY RANDOM()', [req.params.level_id]);
        res.json(rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});


// --- ADMIN API (PROTECTED) ---

// 1. MANAGE TOPICS
app.get('/api/admin/topics', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM topics ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { 
        console.error("Error Fetch Topics:", err);
        res.status(500).json({ error: "Database Error" }); 
    }
});

app.post('/api/admin/topics', requireAuth, async (req, res) => {
    try {
        const { title, category_slug, description, thumbnail_url } = req.body;
        // Upload ke ImageKit
        const uploadedUrl = await uploadImage(thumbnail_url, `thumb_${category_slug}`, "/topics");
        
        const { rows } = await pool.query(
            'INSERT INTO topics (title, category_slug, description, thumbnail_url) VALUES ($1, $2, $3, $4) RETURNING *', 
            [title, category_slug, description, uploadedUrl]
        );
        res.status(201).json(rows[0]);
    } catch (err) { 
        console.error(err); 
        res.status(500).json({ error: err.message }); 
    }
});

app.delete('/api/admin/topics/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM topics WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. MANAGE LEVELS
app.post('/api/admin/levels', requireAuth, async (req, res) => {
    try {
        const { topic_id, title, level_order } = req.body;
        const { rows } = await pool.query(
            'INSERT INTO game_levels (topic_id, title, level_order) VALUES ($1, $2, $3) RETURNING *',
            [topic_id, title, level_order || 1]
        );
        res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/levels/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM game_levels WHERE id = $1', [req.params.id]);
        res.json({ message: 'Level Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. MANAGE KOTOBA (GAME CARDS)
app.post('/api/admin/kotoba', requireAuth, async (req, res) => {
    try {
        const { level_id, image_url, word_url } = req.body;
        
        // Upload 2 Gambar ke ImageKit
        const imgCloud = await uploadImage(image_url, `img_${Date.now()}`, `/kotoba/level_${level_id}`);
        const wordCloud = await uploadImage(word_url, `word_${Date.now()}`, `/kotoba/level_${level_id}`);

        const { rows } = await pool.query(
            'INSERT INTO kotoba (level_id, image_url, word_url) VALUES ($1, $2, $3) RETURNING *',
            [level_id, imgCloud, wordCloud]
        );
        res.status(201).json(rows[0]);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.delete('/api/admin/kotoba/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM kotoba WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. MANAGE QUIZZES
app.post('/api/admin/quizzes', requireAuth, async (req, res) => {
    try {
        const { level_id, question, image_url, option_a, option_b, option_c, option_d, correct_answer } = req.body;
        
        // Upload Gambar Soal (jika ada) ke ImageKit
        const imgCloud = await uploadImage(image_url, `quiz_${Date.now()}`, `/quizzes/level_${level_id}`);

        const { rows } = await pool.query(
            'INSERT INTO quizzes (level_id, question, image_url, option_a, option_b, option_c, option_d, correct_answer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [level_id, question, imgCloud, option_a, option_b, option_c, option_d, correct_answer]
        );
        res.status(201).json(rows[0]);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.delete('/api/admin/quizzes/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM quizzes WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Fallback Route (404 for pages)
app.use((req, res) => {
    res.status(404).send('<h1>404 Not Found</h1>');
});

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));