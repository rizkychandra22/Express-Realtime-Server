export async function saveMessage(db, senderId, privateChatId, text) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO messages (sender_id, private_chat_id, message) VALUES (?, ?, ?)`,
            [senderId, privateChatId, text],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            }
        );
    });
}

export async function getChatHistory(db, privateChatId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT m.message as text, m.created_at, u.name as user, u.role, m.sender_id
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.private_chat_id = ?
            ORDER BY m.created_at ASC
        `;
        db.all(query, [privateChatId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}