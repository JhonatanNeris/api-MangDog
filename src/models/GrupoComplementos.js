import mongoose from "mongoose"

const complementoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String },
    preco: { type: Number, default: 0 },
    imagemUrl: {type: String},
    disponivel: { type: Boolean, default: true },
});

const grupoComplementosSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: [true, 'O nome do grupo de complementos é obrigatório.'] },
    opcional: {type: Boolean, required: true},
    qtdMin: {type: Number, required: true},
    qtdMax: {type: Number, required: true},
    complementos: [complementoSchema],
    disponivel: { type: Boolean, default: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "cliente", required: true }, 
}, { versionKey: false });

const grupoComplementos = mongoose.model("grupoComplementos", grupoComplementosSchema);

export { grupoComplementos, grupoComplementosSchema };