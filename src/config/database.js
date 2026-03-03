import sqlite3 from 'sqlite3';
import runMigrations from '../migrations/allRunningSchema.js';

function initDatabase() {
    const db = new sqlite3.Database('database.db', (err) => {
        if (err) {
            console.error(`==========================================\nGagal koneksi ke database SQLite: ${err.message}\n==========================================`);
        } else {
            // Aktifkan foreign key untuk relasi antar tabel bisa dijalankan
            db.run("PRAGMA foreign_keys = ON");
            console.log(`==========================================\nKoneksi ke database SQLite berhasil!\n==========================================`);
        }
    });
    
    // Running Migrations
    runMigrations(db);

    return db;
}

export default initDatabase;
