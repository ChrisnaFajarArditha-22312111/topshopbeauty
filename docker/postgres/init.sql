-- =========================================================
-- init.sql — Inisialisasi PostgreSQL untuk Topshop Kosmetik AI
-- Script ini dijalankan otomatis saat container postgres pertama kali dibuat
-- =========================================================

-- Aktifkan ekstensi pgvector untuk menyimpan embedding AI
CREATE EXTENSION IF NOT EXISTS vector;

-- Aktifkan ekstensi uuid-ossp untuk generate UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Aktifkan ekstensi pg_trgm untuk pencarian teks fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Aktifkan ekstensi unaccent untuk pencarian tanpa aksen
CREATE EXTENSION IF NOT EXISTS unaccent;
