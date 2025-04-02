import mongoose from "mongoose"

const ClienteSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: true },
    cnpj: { type: String, unique: true },
    tema: { type: String, default: "padrão" },
    logoUrl: { type: String }, 
    emailContato: { type: String, required: true },
    criadoEm: { type: Date, default: Date.now },
}, { versionKey: false });

const cliente = mongoose.model("cliente", ClienteSchema);

export default cliente;
