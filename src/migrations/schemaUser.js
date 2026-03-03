function createUserTable(db) {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `, (err) => {
        if (err) {
            console.error(`Gagal membuat table users: ${err.message}\n==========================================`);
        } else {
            console.log(`Table users siap digunakan...!\n==========================================`);
        }
    });
}

export default createUserTable;