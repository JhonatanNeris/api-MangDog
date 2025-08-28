import mongoose from "mongoose"

//Import do schema categoria 
import { categoriaSchema } from '../models/Categoria.js'

const produtoSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: [true, 'O nome do produto é obrigatório'] },
    descricao: { type: String },
    imagemUrl: { type: String },
    preco: { type: Number, min: [0.1, 'O valor mínimo é R$ 0,1, R${VALUE} não é um valor válido.'], required: [true, "O preço do produto é obrigatório."] },
    categoria: { type: categoriaSchema, required: [true, "A categoria do produto é obrigatória."] },
    grupoComplementos: [{type: mongoose.Schema.Types.ObjectId, ref: "grupoComplementos"}],
    disponivel: { type: Boolean, default: true },
    controlaEstoque: { type: Boolean, default: false },
    quantidadeEstoque: { type: Number, min: 0, default: 0 },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "cliente", required: true },
}, { versionKey: false });

const produto = mongoose.model("produtos", produtoSchema);

export { produto, produtoSchema };