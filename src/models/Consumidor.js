import mongoose from "mongoose"

const ConsumidorSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: false },
    documentNumber: { type: String, required: false }, // cpf
    telefone: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
}, { versionKey: false, timestamps: true });

const consumidor = mongoose.model("consumidores", ConsumidorSchema);

export default consumidor;
