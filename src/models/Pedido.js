import mongoose from "mongoose"

//Import do schema  
import { produto } from "./Produto.js";
import { categoriaSchema } from "./Categoria.js";
import { adicionalSchema } from "./Produto.js";

const adicionalPedidoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String},
    preco: { type: Number, required: true },
    quantidade: { type: Number, required: true }, // Quantidade do adicional no pedido
    precoTotal: { type: Number, required: true }
});

const itemPedidoSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'produtos', required: true }, // Referência ao produto
    nome: { type: String, required: true },
    descricao: { type: String },
    obs: {type: String},
    preco: { type: Number, required: true },
    categoria: { type: categoriaSchema, required: true }, // Usar schema de categoria
    adicionais: [adicionalPedidoSchema], // Array de adicionais
    quantidade: { type: Number, required: true }, // Quantidade do item no pedido
    totalItem: { type: Number, required: true },
    precoTotal: { type: Number, required: true } 
});

const pedidoSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nomeCliente: { type: String, required: true },
    valorTotal: { type: Number, required: true },
    horario: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['em preparo', 'pronto', 'concluído'],
        default: 'em preparo'
    },
    tipoPedido: {
        type: String,
        enum: ['comer aqui', 'para viagem'],
        required: true
    },
    itens: [itemPedidoSchema]
}, { versionKey: false });

const pedido = mongoose.model("pedidos", pedidoSchema);

export default pedido;