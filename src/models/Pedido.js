import mongoose from "mongoose"

//Import do schema  
import { produto } from "./Produto.js";
import { categoriaSchema } from "./Categoria.js";
import { adicionalSchema } from "./Produto.js";

const adicionalPedidoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String },
    preco: { type: Number, required: true },
    quantidade: { type: Number, required: true }, // Quantidade do adicional no pedido
    precoTotal: { type: Number, required: true }
});

const itemPedidoSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'produtos', required: true }, // Referência ao produto
    idItem: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // Gera um ID único para cada item
    nome: { type: String, required: true },
    descricao: { type: String },
    obs: { type: String },
    preco: { type: Number, required: true },
    categoria: { type: categoriaSchema, required: true }, // Usar schema de categoria
    adicionais: [adicionalPedidoSchema], // Array de adicionais
    quantidade: { type: Number, required: true }, // Quantidade do item no pedido
    totalItem: { type: Number, required: true },
    precoTotal: { type: Number, required: true },
    status: {
        type: String,
        enum: ['em preparo', 'pronto', 'cancelado'],
        default: 'em preparo'
    }
});

const pedidoSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nomeCliente: { type: String, required: true },
    valorTotal: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    desconto: { type: Number, default: 0, min: 0 },
    horario: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['em preparo', 'pronto', 'concluído', 'cancelado'],
        default: 'em preparo'
    },
    tipoPedido: {
        type: String,
        enum: ['comer aqui', 'para viagem'],
        required: true
    },
    formaPagamento: {
        type: String,
        enum: ['débito', 'crédito', 'pix', 'dinheiro', 'voucher', 'em aberto']
    },
    itens: [itemPedidoSchema],
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "cliente", required: true }, 
}, { versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

pedidoSchema.virtual('quantidadeItens').get(function () {
    return this.itens.reduce((total, item) => total + item.quantidade, 0);
});


const pedido = mongoose.model("pedidos", pedidoSchema);

export default pedido;