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
import { saveMessage, getChatHistory } from './models/dbMessage.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app); 
const io = new Server(httpServer, { cors: { origin: "*" } });

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Mohon login terlebih dahulu"));
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Sesi berakhir, silahkan login ulang"));
        socket.user = decoded; 
        next();
    });
});

const db = initDatabase();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('io', io);

let onlineUsers = new Map(); 

// Helper ID Room: ID kecil_ID besar (Contoh: 1_5)
const getPrivateChatId = (id1, id2) => [id1, id2].sort((a, b) => a - b).join('_');

io.on('connection', (socket) => {
    const { id, name, role, username } = socket.user;       
    onlineUsers.set(socket.id, { dbId: id, name, username, role });
    
    const broadcastOnlineList = () => {
        const users = Array.from(onlineUsers.entries()).map(([sId, data]) => ({
            socketId: sId,
            dbId: data.dbId,
            name: data.name,
            role: data.role
        }));
        io.emit('online_list', users);
    };

    broadcastOnlineList();
    console.log(`[Socket] ${name} (${role}) terhubung.`);

    // Join Room & Muat Histori
    socket.on('join_private_room', async ({ targetUserId }) => {
        const chatRoomId = getPrivateChatId(id, targetUserId);
        socket.join(chatRoomId);
        try {
            const rawHistory = await getChatHistory(db, chatRoomId);
            const history = rawHistory.map(h => ({
                ...h,
                time: new Date(h.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            }));
            socket.emit('load_history', history);
        } catch (err) {
            console.error("Gagal muat histori:", err.message);
        }
    });

    // Kirim Pesan Private
    socket.on('send_private_message', async ({ targetUserId, text }) => {
        const chatRoomId = getPrivateChatId(id, targetUserId);
        try {
            await saveMessage(db, id, chatRoomId, text);
            io.to(chatRoomId).emit('receive_private_message', {
                sender_id: id,
                user: name,
                text: text,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
        } catch (err) {
            console.error("Gagal simpan pesan:", err.message);
        }
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
        broadcastOnlineList();
        console.log(`[Socket] ${name} terputus.`);
    });
});

app.use('/api/auth', authRoutes(db));
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}\nWeb Socket siap menerima koneksi....`);
});