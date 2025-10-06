import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// ===== Fix __dirname equivalent in ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Database Connection =====
const DB_FILE = path.join(__dirname, "jahitan.db");
const db = new sqlite3.Database(DB_FILE);

// ===== Utils =====
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dateToId(dateStr) {
  const d = new Date(dateStr);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ===== Extract =====
async function getPelanggan() {
  return await all("SELECT * FROM pelanggan");
}

async function getPenjahit() {
  return await all("SELECT * FROM penjahit");
}

async function getBahan() {
  return await all("SELECT * FROM bahan");
}

async function getLayanan() {
  return await all("SELECT * FROM layanan");
}

async function getStatusPesanan() {
  return await all("SELECT * FROM status_pesanan");
}

async function getPesanan() {
  return await all("SELECT * FROM pesanan");
}

async function getDetailPesanan() {
  return await all("SELECT * FROM detail_pesanan");
}

async function getPembayaran() {
  return await all("SELECT * FROM pembayaran");
}

// ===== Transform =====
function extractDates(pesanan, pembayaran) {
  return [
    ...new Set([
      ...pesanan.map((p) => p.tanggal_pesan),
      ...pembayaran.map((b) => b.tanggal_bayar).filter(Boolean),
    ]),
  ];
}

// ===== Load =====
async function loadDimPelanggan(rows) {
  for (const c of rows) {
    await run(
      `INSERT OR IGNORE INTO dim_pelanggan (pelanggan_id, nama_pelanggan, no_hp, alamat, jenis_kelamin, tanggal_daftar, tipe_pelanggan, referensi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.pelanggan_id, c.nama, c.no_hp, c.alamat, c.jenis_kelamin, c.tanggal_daftar, c.tipe_pelanggan, c.referensi]
    );
  }
}

async function loadDimPenjahit(rows) {
  for (const j of rows) {
    await run(
      `INSERT OR IGNORE INTO dim_penjahit (penjahit_sk, penjahit_id, nama_penjahit, spesialisasi, tanggal_mulai_kerja, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [j.penjahit_id, j.penjahit_id, j.nama_penjahit, j.spesialisasi, j.tanggal_mulai_kerja, j.status]
    );
  }
}

async function loadDimBahan(rows) {
  for (const b of rows) {
    await run(
      `INSERT OR IGNORE INTO dim_bahan (bahan_sk, bahan_id, nama_bahan, kategori_bahan, supplier, harga_per_meter, satuan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [b.bahan_id, b.bahan_id, b.nama_bahan, b.kategori_bahan, b.supplier, b.harga_per_meter, b.satuan]
    );
  }
}

async function loadDimLayanan(rows) {
  for (const l of rows) {
    await run(
      `INSERT OR IGNORE INTO dim_layanan (layanan_sk, layanan_id, nama_layanan, deskripsi, harga_dasar, durasi_estimasi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [l.layanan_id, l.layanan_id, l.nama_layanan, l.deskripsi, l.harga_dasar, l.durasi_estimasi]
    );
  }
}

async function loadDimStatusPesanan(rows) {
  for (const s of rows) {
    await run(
      `INSERT OR IGNORE INTO dim_status_pesanan (status_sk, status_id, nama_status, keterangan)
       VALUES (?, ?, ?, ?)`,
      [s.status_id, s.status_id, s.nama_status, s.keterangan]
    );
  }
}

async function loadDimPembayaran(rows) {
  for (const p of rows) {
    await run(
      `INSERT OR IGNORE INTO dim_pembayaran (pembayaran_sk, pembayaran_id, metode, tanggal_bayar, status, diskon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [p.pembayaran_id, p.pembayaran_id, p.metode, p.tanggal_bayar, p.status, p.diskon]
    );
  }
}

async function loadDimTanggal(pesanan, pembayaran) {
  const dates = extractDates(pesanan, pembayaran);
  for (const d of dates) {
    const id = dateToId(d);
    const dateObj = new Date(d);
    await run(
      `INSERT OR IGNORE INTO dim_tanggal (tanggal_id, tanggal, hari, bulan, tahun, kuartal, minggu_ke)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        d,
        dateObj.getDate(),
        dateObj.getMonth() + 1,
        dateObj.getFullYear(),
        Math.ceil((dateObj.getMonth() + 1) / 3),
        Math.ceil(dateObj.getDate() / 7),
      ]
    );
  }
}

// ===== Load Fact Table =====
async function loadFactPesanan(pesanan, detailPesanan) {
  for (const d of detailPesanan) {
    const p = pesanan.find((ps) => ps.pesanan_id === d.pesanan_id);
    if (!p) continue;

    const lamaProses =
      p.tanggal_selesai && p.tanggal_pesan
        ? (new Date(p.tanggal_selesai) - new Date(p.tanggal_pesan)) /
          (1000 * 60 * 60 * 24)
        : null;

    await run(
      `INSERT INTO fact_pesanan 
      (pesanan_id, tanggal_id, pelanggan_sk, penjahit_sk, bahan_sk, layanan_sk, status_sk, pembayaran_sk,
       jumlah_item, jumlah_meter, total_harga, diskon, rating, lama_proses_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.pesanan_id,
        dateToId(p.tanggal_pesan),
        p.pelanggan_id,
        p.penjahit_id,
        d.bahan_id,
        p.layanan_id,
        p.status_id,
        p.pesanan_id, // asumsi satu pesanan = satu pembayaran
        1,
        d.jumlah_meter,
        p.total_harga,
        0,
        p.rating,
        lamaProses,
      ]
    );
  }
}

// ===== MAIN ETL =====
async function etl() {
  console.log("🚀 Starting ETL for Jasa Jahit Online");

  try {
    const pelanggan = await getPelanggan();
    const penjahit = await getPenjahit();
    const bahan = await getBahan();
    const layanan = await getLayanan();
    const status = await getStatusPesanan();
    const pesanan = await getPesanan();
    const detail = await getDetailPesanan();
    const pembayaran = await getPembayaran();

    console.log("✅ Extract completed");

    await loadDimPelanggan(pelanggan);
    await loadDimPenjahit(penjahit);
    await loadDimBahan(bahan);
    await loadDimLayanan(layanan);
    await loadDimStatusPesanan(status);
    await loadDimPembayaran(pembayaran);
    await loadDimTanggal(pesanan, pembayaran);
    await loadFactPesanan(pesanan, detail);

    console.log("🎉 ETL Process Completed Successfully!");
  } catch (err) {
    console.error("❌ ETL Error:", err);
  } finally {
    db.close();
  }
}

etl();
