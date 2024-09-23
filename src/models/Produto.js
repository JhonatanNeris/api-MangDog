import mongoose from "mongoose"

//Import do schema categoria 
import { categoriaSchema } from '../models/Categoria.js'

// Definindo o esquema para os adicionais
const adicionalSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String },
    preco: { type: Number, required: true }
});

const produtoSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: [true, 'O nome do produto é obrigatório'] },
    descricao: { type: String },
    preco: { type: Number, min: [0.1, 'O valor mínimo é R$ 0,1, R${VALUE} não é um valor válido.'], required: [true, "O preço do produto é obrigatório."] },
    categoria: { type: categoriaSchema, required: [true, "A categoria do produto é obrigatória."] },
    adicionais: [adicionalSchema]
}, { versionKey: false });

const produto = mongoose.model("produtos", produtoSchema);

export { produto, adicionalSchema, produtoSchema };