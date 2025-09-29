const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk serve static files dari folder public
app.use(express.static(path.join(__dirname, "public")));

// Rute untuk halaman utama (index.html dari folder public)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Rute untuk halaman aisatsu
app.get('/aisatsu',  (req, res) => {
    res.sendFile(path.join(__dirname, 'public/aisatsu', 'kotoba-aisatsu.html'));
});

// Rute untuk quiz aisatsu
app.get('/quiz-aisatsu',  (req, res) => {
    res.sendFile(path.join(__dirname, 'public/aisatsu', 'quiz-aisatsu.html'));
});
app.get('/kotoba-mochimono',  (req, res) => {
    res.sendFile(path.join(__dirname, 'public/mochimono', 'kotoba-mochimono.html'));
});

// Rute untuk quiz aisatsu
app.get('/mochimono-quiz',  (req, res) => {
    res.sendFile(path.join(__dirname, 'public/mochimono', 'mochimono-quiz.html'));
});

// Rute untuk halaman yasumi
app.get('/yasumi',  (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'yasumi.html'));
});

// Middleware untuk handle 404 - halaman tidak ditemukan
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Halaman Tidak Ditemukan</h1>
        <p>Halaman yang Anda cari tidak ada.</p>
        <a href="/">Kembali ke Beranda</a>
    `);
});

// Middleware untuk handle error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Terjadi kesalahan pada server!');
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
