// src/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || "sua-chave-secreta";
const FRONTEND_URL = process.env.FRONTEND_URL

let io;

export const setupSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: FRONTEND_URL, // ou a URL do seu frontend
        },
    });

    // Middleware de autenticação
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Token não fornecido"));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.data.usuario = decoded; // agora socket.data.usuario está disponível
            next();
        } catch (err) {
            console.error("Token inválido:", err);
            next(new Error("Token inválido"));
        }
    });

    io.on("connection", (socket) => {
        const usuario = socket.data.usuario;
        console.log("Cliente autenticado:", socket.id, usuario?.nome || usuario);

        // Espera o front-end informar o ID do cliente/loja
        socket.on("entrar-na-sala", (clienteId) => {
            socket.join(clienteId);
            console.log(`Socket ${socket.id} entrou na sala ${clienteId}`);
        });

        // Encerrar conexão após 5 minutos
        const MAX_LIFETIME_MS = 5 * 60 * 1000;
        const timeout = setTimeout(() => {
            console.log(`Socket ${socket.id} desconectado por inatividade.`);
            socket.disconnect(true);
        }, MAX_LIFETIME_MS);


        socket.on("disconnect", () => {
            console.log("Cliente desconectado:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io não foi inicializado');
    }
    return io;
};