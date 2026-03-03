import bcrypt from 'bcrypt';

export async function registerUser(db, user) {
    const { name, username, email, password, role } = user;

    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO users (name, username, email, password, role)
             VALUES (?, ?, ?, ?, ?)`,
            [name, username, email, hashedPassword, role || 'user'],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            }
        );
    });
}