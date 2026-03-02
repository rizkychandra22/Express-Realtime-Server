import { registerService, loginService } from '../services/authService.js';

export const register = (db) => async (req, res) => {
    try {
        const result = await registerService(db, req.body);
        const io = req.app.get('io');
        
        // Broadcast notifikasi ke Admin/User lain
        io.emit('NEW_USER_JOINED', {
            username: req.body.username,
            role: req.body.role || 'student'
        });

        res.status(201).json({ message: 'Register berhasil', userId: result.id });
    } catch (error) {
        res.status(error.statusCode || 400).json({ message: 'Registrasi gagal', error: error.message });
    }
};

export const login = (db) => async (req, res) => {
    try {
        const { token, user } = await loginService(db, req.body);
        res.status(200).json({
            message: 'Login berhasil',
            token, // Token ini yang dikirim ke frontend untuk Socket.io
            user
        });
    } catch (error) {
        res.status(401).json({ message: 'Login gagal', error: error.message });
    }
};