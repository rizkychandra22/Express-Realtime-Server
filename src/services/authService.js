import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerUser } from "../models/dbUser.js";

export async function registerService(db, user) {
    const { name, username, email, password, role } = user;
    const allowedRoles = ['admin', 'user'];

    if (!name) throw new Error('Name cannot be empty');
    if (!username) throw new Error('Username cannot be empty');
    if (!email) throw new Error('Email cannot be empty');
    if (!password) throw new Error('Password cannot be empty');
    
    if (role && !allowedRoles.includes(role)) {
        throw new Error('Role is not valid');
    }

    const existingUser = await new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM users WHERE username = ?`,
            [username],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });

    if (existingUser) {
        const error = new Error('The username already exists');
        error.statusCode = 409;
        throw error;
    }

    return await registerUser(db, user);
}

export async function loginService(db, credentials) {
    const { username, password } = credentials;

    const user = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    if (!user) throw new Error('User tidak ditemukan');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Password salah');

    // Buat Token JWT
    const token = jwt.sign(
        { 
            id: user.id, 
            name: user.name,
            username: user.username, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return { 
        token, 
        user: { 
            name: user.name,
            username: user.username, 
            role: user.role 
        } 
    };
}