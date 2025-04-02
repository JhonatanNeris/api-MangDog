import mongoose from "mongoose"

const usuarioSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    permissao: { type: String, enum: ['admin', 'colaborador'], default: 'colaborador' },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "cliente", required: true }, // Referência ao cliente
}, { versionKey: false });

const usuario = mongoose.model("usuarios", usuarioSchema);

export default usuario;