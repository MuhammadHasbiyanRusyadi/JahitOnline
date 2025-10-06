import sqlite3 from "sqlite3";
import { open } from "sqlite";

// ===== Seeding OLTP Data for Jasa Jahit Online =====
async function seedData() {
  const db = await open({
    filename: "./jahitan.db",
    driver: sqlite3.Database,
  });

  console.log("🌱 Seeding OLTP tables...");

  // --- Pelanggan ---
  await db.exec(`
    INSERT INTO pelanggan (nama, no_hp, alamat, jenis_kelamin, tanggal_daftar, tipe_pelanggan, referensi)
    VALUES 
    ('Ujang Snapdragon', '08123456789', 'Jl. Anggrek Pontianak No. 2', 'Laki-laki', '2025-01-10', 'Reguler', 'Instagram'),
    ('Rahmat Seluncur', '08213456780', 'Jl. Stasiun Lempuyangan No. 5', 'Perempuan', '2025-02-01', 'Member', 'Mamah'),
    ('Budiono Siregar', '08187654321', 'Jl. Selat Sunda No. 9', 'Laki-laki', '2025-03-05', 'VIP', 'Google');
  `); 

  // --- Penjahit ---
  await db.exec(`
    INSERT INTO penjahit (nama_penjahit, spesialisasi, tanggal_mulai_kerja, status)
    VALUES 
    ('Hastuti', 'Kemeja dan Celana', '2022-03-10', 'Aktif'),
    ('Radha', 'Dress dan Kebaya', '2023-01-05', 'Aktif');
  `);

  // --- Bahan ---
  await db.exec(`
    INSERT INTO bahan (nama_bahan, kategori_bahan, supplier, harga_per_meter, stok_meter, satuan, tanggal_masuk, minimum_stok)
    VALUES
    ('Katun Premium', 'Kemeja', 'PT Tekstil Jaya', 45000, 100, 'meter', '2025-09-01', 10),
    ('Denim', 'Celana', 'PT DenimKu', 60000, 50, 'meter', '2025-09-05', 8);
  `);

  // --- Layanan ---
  await db.exec(`
    INSERT INTO layanan (nama_layanan, deskripsi, harga_dasar, durasi_estimasi)
    VALUES
    ('Jahit Kemeja', 'Jahit Custom, area ketiak agak dibesarin dan juga kancingnya banyakin', 120000, 3),
    ('Jahit Celana', 'Potong Cutbray hehe', 100000, 2);
  `);

  // --- Status Pesanan ---
  await db.exec(`
    INSERT INTO status_pesanan (nama_status, keterangan)
    VALUES
    ('Pending', 'Order has been received but not processed'),
    ('In Progress', 'Order is currently being sewn'),
    ('Completed', 'Order finished and ready for pickup');
  `);

  // --- Pesanan ---
  await db.exec(`
    INSERT INTO pesanan (pelanggan_id, penjahit_id, layanan_id, status_id, tanggal_pesan, estimasi_selesai, tanggal_selesai, sumber_pemesanan, status_pembayaran, total_harga, rating, catatan_pelanggan)
    VALUES
    (1, 1, 1, 3, '2025-09-20', '2025-09-23', '2025-09-22', 'Online', 'Paid', 120000, 5, 'Cepat dan rapi'),
    (2, 2, 2, 2, '2025-09-25', '2025-09-27', NULL, 'Offline', 'Pending', 100000, NULL, 'Tolong pakai bahan halus');
  `);

  // --- Detail Pesanan ---
  await db.exec(`
    INSERT INTO detail_pesanan (pesanan_id, bahan_id, warna, model_pakaian, jumlah_meter, harga_per_meter, subtotal, catatan_penjahit)
    VALUES
    (1, 1, 'Putih', 'Formal', 2, 45000, 90000, 'Gunakan pola regular fit'),
    (2, 2, 'Biru', 'Slim Fit', 1.5, 60000, 90000, 'Tambahkan saku belakang');
  `);

  // --- Pembayaran ---
  await db.exec(`
    INSERT INTO pembayaran (pesanan_id, metode, tanggal_bayar, jumlah_bayar, status, diskon, nomor_referensi, kasir, catatan_pembayaran)
    VALUES
    (1, 'Transfer', '2025-09-22', 120000, 'Lunas', 0, 'TRX-0001', 'Hastuti', 'Pembayaran diterima'),
    (2, 'Cash', NULL, 0, 'Belum Lunas', 0, NULL, 'Radha', NULL);
  `);

  console.log("✅ Seeding complete.");
  await db.close();
}

seedData().catch((err) => console.error(err));
