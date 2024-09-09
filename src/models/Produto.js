import mongoose from "mongoose"

//Import do schema categoria 
import { categoriaSchema } from '../models/Categoria.js'

// Definindo o esquema para os adicionais
const adicionalSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String},
    preco: { type: Number, required: true }
});

const produtoSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: true },
    descricao: { type: String},
    preco: { type: Number, required: true },
    categoria: { type: categoriaSchema, required: true },
    adicionais: [adicionalSchema]
}, { versionKey: false });

const produto = mongoose.model("produtos", produtoSchema);

export {produto, adicionalSchema, produtoSchema};