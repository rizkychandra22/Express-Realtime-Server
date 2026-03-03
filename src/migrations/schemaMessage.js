function createMessageTable(db) {
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL, 
            private_chat_id TEXT NOT NULL, 
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `, (err) => {
        if (err) {
            console.error(`Gagal membuat table messages: ${err.message}\n==========================================`);
        } else {
            console.log(`Table messages siap digunakan...!\n==========================================`);
        }
    });
}

export default createMessageTable;