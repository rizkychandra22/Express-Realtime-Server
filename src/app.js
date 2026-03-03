import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import initDatabase from './config/database.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
 
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app); 

// 1. Konfigurasi Socket.IO
const io = new Server(httpServer, {
  cors: { origin: "*" } 
});

// 2. Middleware Socket: Validasi Token JWT (Pintu Masuk Keamanan)
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Mohon login terlebih dahulu"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Sesi berakhir, silahkan login ulang"));
        
        // Data 'decoded' berisi id, name, username, dan role dari authService
        socket.user = decoded; 
        next();
    });
});

const db = initDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Beri akses socket.io ke seluruh routes (digunakan di authController)
app.set('io', io);

// 3. Logika Utama Web Socket
let onlineUsers = new Map(); 

io.on('connection', (socket) => {
    const { name, role, username } = socket.user;       
    
    // Simpan data user ke dalam memori (RAM)
    onlineUsers.set(socket.id, { name, username, role });
    
    // Fungsi pembantu untuk mengirim daftar user online yang formal
    const broadcastOnlineList = () => {
        const users = Array.from(onlineUsers.entries()).map(([id, data]) => ({
            socketId: id, // ID unik koneksi (penting untuk Private Chat)
            name: data.name,
            role: data.role
        }));
        io.emit('online_list', users);
    };

    broadcastOnlineList();
    console.log(`[Socket] ${name} (${role}) terhubung.`);

    // Event: Menerima pesan dan menyebarkannya (Broadcast)
    socket.on('send_message', (text) => {
        io.emit('receive_message', {
            user: name, // Menggunakan Nama Lengkap dari JWT
            role: role, 
            text: text,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
    });

    // Event: User terputus (Tutup Tab / Logout)
    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
        broadcastOnlineList();
        console.log(`[Socket] ${name} terputus.`);
    });
});

// 4. Routes API
app.use('/api/auth', authRoutes(db));

app.get('/', (req, res) => {
  res.send('Server Web Socket Aktif!');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`==========================================\nServer berjalan di http://localhost:${PORT}\nWeb Socket siap menerima koneksi....`);
});