import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import initDatabase from './config/database.js'
import authRoutes from './routes/authRoutes.js'

dotenv.config();
 
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app); 
const io = new Server(httpServer, {     // Konfigurasi CORS untuk Socket.IO
  cors: { origin: "*" } 
});

// Middleware Socket: Izinkan user yang sudah login dan validasi token JWT
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Mohon login terlebih dahulu"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Sesi berakhir, silahkan login ulang"));
        socket.user = decoded; // Data user tersimpan di objek socket
        next();
    });
});

const db = initDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Beri akses socket.io ke seluruh routes melalui middleware
app.set('io', io);

// Logika untuk mengelola user online dan chat realtime
let onlineUsers = new Map(); // Pakai Map agar lebih mudah mengelola data user

io.on('connection', (socket) => {
    const { name, role, username } = socket.user;       
    
    // Simpan data user yang online
    onlineUsers.set(socket.id, { name, username, role });
    
    // Kirim daftar user online ke semua orang
    io.emit('online_list', Array.from(onlineUsers.values()));
    console.log(`${name} (${role}) is online`);

    // Chat Realtime (Data user aman karena diambil dari Server-side JWT)
    socket.on('send_message', (text) => {
        io.emit('receive_message', {
            user: name,
            role: role, 
            text: text,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
        io.emit('online_list', Array.from(onlineUsers.values()));
        console.log(`${name} disconnected`);
    });
});

app.use('/api/auth', authRoutes(db));

app.get('/', (req, res) => {
  res.send('Server backend is running!');
});

const PORT = process.env.PORT || 3000;

// Gunakan httpServer untuk menjalankan server agar Socket.IO dapat bekerja
httpServer.listen(PORT, () => {
    console.log(`Server & Socket berjalan di http://localhost:${PORT}`);
});