import sqlite3 from 'sqlite3';
import runMigrations from '../migrations/allRunningSchema.js';

function initDatabase() {
    const db = new sqlite3.Database('database.db', (err) => {
        if (err) {
            console.error(`==========================================\nGagal koneksi ke database SQLite: ${err.message}`);
        } else {
            console.log(`==========================================\nKoneksi ke database SQLite berhasil!`);
        }
    });
    
    // Running Migrations
    runMigrations(db);

    return db;
}

export default initDatabase;
