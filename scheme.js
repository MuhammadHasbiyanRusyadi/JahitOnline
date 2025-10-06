import sqlite3 from "sqlite3";
import { open } from "sqlite";

// ===== Create Database Schema for Jasa Jahit Online =====
async function createSchema() {
  const db = await open({
    filename: "./jahitan.db",
    driver: sqlite3.Database,
  });

  // ================= OLTP SCHEMA =================
  await db.exec(`
    -- ======================= OLTP TABLES =========================

    CREATE TABLE IF NOT EXISTS pelanggan (
      pelanggan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama VARCHAR(100),
      no_hp VARCHAR(20),
      alamat TEXT,
      jenis_kelamin VARCHAR(18),
      tanggal_daftar DATE,
      tipe_pelanggan VARCHAR(20),
      referensi VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS penjahit (
      penjahit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_penjahit VARCHAR(100),
      spesialisasi VARCHAR(100),
      tanggal_mulai_kerja DATE,
      status VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS bahan (
      bahan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_bahan VARCHAR(100),
      kategori_bahan VARCHAR(50),
      supplier VARCHAR(100),
      harga_per_meter DECIMAL(10,2),
      stok_meter DECIMAL(10,2),
      satuan VARCHAR(10),
      tanggal_masuk DATE,
      minimum_stok DECIMAL(10,2)
    );

    CREATE TABLE IF NOT EXISTS layanan (
      layanan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_layanan VARCHAR(50),
      deskripsi TEXT,
      harga_dasar DECIMAL(10,2),
      durasi_estimasi INTEGER
    );

    CREATE TABLE IF NOT EXISTS status_pesanan (
      status_id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_status VARCHAR(30),
      keterangan TEXT
    );

    CREATE TABLE IF NOT EXISTS pesanan (
      pesanan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      pelanggan_id INTEGER,
      penjahit_id INTEGER,
      layanan_id INTEGER,
      status_id INTEGER,
      tanggal_pesan DATE,
      estimasi_selesai DATE,
      tanggal_selesai DATE,
      sumber_pemesanan VARCHAR(30),
      status_pembayaran VARCHAR(28),
      total_harga DECIMAL(10,2),
      rating INTEGER,
      catatan_pelanggan TEXT,
      FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(pelanggan_id),
      FOREIGN KEY (penjahit_id) REFERENCES penjahit(penjahit_id),
      FOREIGN KEY (layanan_id) REFERENCES layanan(layanan_id),
      FOREIGN KEY (status_id) REFERENCES status_pesanan(status_id)
    );

    CREATE TABLE IF NOT EXISTS detail_pesanan (
      detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
      pesanan_id INTEGER,
      bahan_id INTEGER,
      warna VARCHAR(50),
      model_pakaian VARCHAR(50),
      jumlah_meter DECIMAL(10,2),
      harga_per_meter DECIMAL(10,2),
      subtotal DECIMAL(10,2),
      catatan_penjahit TEXT,
      FOREIGN KEY (pesanan_id) REFERENCES pesanan(pesanan_id),
      FOREIGN KEY (bahan_id) REFERENCES bahan(bahan_id)
    );

    CREATE TABLE IF NOT EXISTS pembayaran (
      pembayaran_id INTEGER PRIMARY KEY AUTOINCREMENT,
      pesanan_id INTEGER,
      metode VARCHAR(50),
      tanggal_bayar DATE,
      jumlah_bayar DECIMAL(10,2),
      status VARCHAR(20),
      diskon DECIMAL(10,2),
      nomor_referensi VARCHAR(50),
      kasir VARCHAR(50),
      catatan_pembayaran TEXT,
      FOREIGN KEY (pesanan_id) REFERENCES pesanan(pesanan_id)
    );
  `);

  // ================= DIMENSIONAL MODEL =================
  await db.exec(`
    -- ======================= DIMENSIONAL TABLES =========================

    CREATE TABLE IF NOT EXISTS dim_pelanggan (
      pelanggan_sk INTEGER PRIMARY KEY AUTOINCREMENT,
      pelanggan_id INTEGER,
      nama_pelanggan VARCHAR(100),
      no_hp VARCHAR(20),
      alamat TEXT,
      jenis_kelamin VARCHAR(10),
      tanggal_daftar DATE,
      tipe_pelanggan VARCHAR(20),
      referensi VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS dim_penjahit (
      penjahit_sk INTEGER PRIMARY KEY AUTOINCREMENT,
      penjahit_id INTEGER,
      nama_penjahit VARCHAR(100),
      spesialisasi VARCHAR(100),
      tanggal_mulai_kerja DATE,
      status VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS dim_bahan (
      bahan_sk INTEGER PRIMARY KEY AUTOINCREMENT,
      bahan_id INTEGER,
      nama_bahan VARCHAR(100),
      kategori_bahan VARCHAR(50),
      supplier VARCHAR(100),
      harga_per_meter DECIMAL(10,2),
      satuan VARCHAR(10)
    );

    CREATE TABLE IF NOT EXISTS dim_layanan (
      layanan_sk INTEGER PRIMARY KEY AUTOINCREMENT,
      layanan_id INTEGER,
      nama_layanan VARCHAR(50),
      deskripsi TEXT,
      harga_dasar DECIMAL(10,2),
      durasi_estimasi INTEGER
    );

    CREATE TABLE IF NOT EXISTS dim_status_pesanan (
      status_sk INTEGER PRIMARY KEY AUTOINCREMENT,
      status_id INTEGER,
      nama_status VARCHAR(30),
      keterangan TEXT
    );

    CREATE TABLE IF NOT EXISTS dim_pembayaran (
      pembayaran_sk INTEGER PRIMARY KEY AUTOINCREMENT,
      pembayaran_id INTEGER,
      metode VARCHAR(50),
      tanggal_bayar DATE,
      status VARCHAR(20),
      diskon DECIMAL(10,2)
    );

    CREATE TABLE IF NOT EXISTS dim_tanggal (
      tanggal_id INTEGER PRIMARY KEY,
      tanggal DATE,
      hari VARCHAR(10),
      bulan VARCHAR(10),
      tahun INTEGER,
      kuartal INTEGER,
      minggu_ke INTEGER
    );

    CREATE TABLE IF NOT EXISTS fact_pesanan (
      fact_pesanan_sk INTEGER PRIMARY KEY AUTOINCREMENT,
      pesanan_id INTEGER,
      tanggal_id INTEGER,
      pelanggan_sk INTEGER,
      penjahit_sk INTEGER,
      bahan_sk INTEGER,
      layanan_sk INTEGER,
      status_sk INTEGER,
      pembayaran_sk INTEGER,
      jumlah_item INTEGER,
      jumlah_meter DECIMAL(10,2),
      total_harga DECIMAL(12,2),
      diskon DECIMAL(10,2),
      rating INTEGER,
      lama_proses_days INTEGER
    );
  `);

  console.log("✅ Schema created successfully for Jasa Jahit Online");
  await db.close();
}

createSchema().catch((err) => console.error(err));
