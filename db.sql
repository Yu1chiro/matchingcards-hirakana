-- HAPUS TABEL LAMA (Urutan penting agar tidak error Foreign Key)
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS kotoba;
DROP TABLE IF EXISTS game_levels;
DROP TABLE IF EXISTS topics;

-- 1. TABEL TOPICS (Bab Utama, misal: "Sekolah")
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category_slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL GAME_LEVELS (Sub-bab, misal: "Part 1: Alat Tulis")
CREATE TABLE game_levels (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    level_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL KOTOBA (Kartu Game - Terhubung ke Level)
CREATE TABLE kotoba (
    id SERIAL PRIMARY KEY,
    level_id INTEGER REFERENCES game_levels(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Gambar ilustrasi benda
    word_url TEXT NOT NULL,  -- Gambar tulisan kata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL QUIZZES (Soal Kuis - Terhubung ke Level)
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    level_id INTEGER REFERENCES game_levels(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    image_url TEXT,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_answer CHAR(1) NOT NULL, -- 'a', 'b', 'c', atau 'd'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);