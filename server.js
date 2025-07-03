import 'dotenv/config'
import http from 'http';
import app from './src/app.js'
// import { setupSocket } from './socket.js';

const PORT = 8080;

const server = http.createServer(app);

//REMOVENDO SOCKET DEVIDO A CUSTOS ELEVADOS
// setupSocket(server);

server.listen(PORT, () => {
    console.log(`Servidor escutando na porta ${PORT}.`);
});