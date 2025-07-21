// src/middlewares/uploadImagem.js
import multer from 'multer';

const storage = multer.memoryStorage(); // armazena a imagem na memória antes de subir
const upload = multer({ storage });

export default upload;
