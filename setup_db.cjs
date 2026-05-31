const fs = require('fs');
const path = require('path');

// Try to load 'pg' module
let Client;
try {
  ({ Client } = require('pg'));
} catch (err) {
  console.error('\n❌ ERROR: Modul "pg" tidak ditemukan!');
  console.log('Untuk menjalankan script ini, Anda perlu menginstal modul PostgreSQL untuk Node.js.');
  console.log('Silakan jalankan perintah berikut di terminal Anda:\n');
  console.log('   npm install pg\n');
  console.log('Setelah itu, jalankan kembali script ini: node setup_db.cjs\n');
  process.exit(1);
}

// Database configuration based on user input
const config = {
  user: 'postgres',          // Default PostgreSQL user
  password: 'rahasia123',    // User's password
  host: 'localhost',         // Local host
  database: 'lelang',        // User's database name
  port: 5432,                // Default PostgreSQL port
};

const client = new Client(config);

async function setupDatabase() {
  console.log('⚡ Menghubungkan ke PostgreSQL...');
  console.log(`🔌 Host: ${config.host}:${config.port}`);
  console.log(`📁 Database: ${config.database}`);
  console.log(`👤 User: ${config.user}`);

  try {
    await client.connect();
    console.log('✅ Berhasil terhubung ke database!');

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Berkas schema.sql tidak ditemukan di jalur: ${schemaPath}`);
    }

    console.log('📖 Membaca schema.sql...');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Menjalankan DDL & DML Seeding...');
    await client.query(sql);

    console.log('\n==================================================');
    console.log('🎉 SELAMAT! Tuan/Nyonya, database berhasil disetup!');
    console.log('==================================================');
    console.log('Tabel berikut telah berhasil dibuat dan diisi dengan data simulasi awal:');
    console.log(' - users (Akun Admin, Inspector, Conductor, Seller, Buyer)');
    console.log(' - auctions (Jadwal Event Lelang)');
    console.log(' - cars (Data Kendaraan Lelang & Status)');
    console.log(' - inspections (Hasil Inspeksi Grade & Defects)');
    console.log(' - bids (Catatan Histori Bid Real-time)');
    console.log(' - nipl_transactions (Catatan Deposit NIPL Virtual Account)');
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat mensetup database:');
    console.error(error.message);
    if (error.code === '28P01') {
      console.log('\n💡 TIPS: Password salah. Pastikan password PostgreSQL Anda adalah "rahasia123".');
    } else if (error.code === '3D000') {
      console.log('\n💡 TIPS: Database "lelang" belum dibuat. Jalankan "CREATE DATABASE lelang;" di pgAdmin atau psql terlebih dahulu.');
    }
  } finally {
    await client.end();
  }
}

setupDatabase();
