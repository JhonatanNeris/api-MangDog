import mongoose from "mongoose"

//Import do schema  
import { produto } from "./Produto.js";
import { categoriaSchema } from "./Categoria.js";

const complementoPedidoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String },
    preco: { type: Number, required: true },
    quantidade: { type: Number, required: true },
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
    complementos: [complementoPedidoSchema],
    grupoComplementos: [{ type: mongoose.Schema.Types.ObjectId, ref: "grupoComplementos" }],
    quantidade: { type: Number, required: true }, // Quantidade do item no pedido
    totalItem: { type: Number, required: true },
    precoTotal: { type: Number, required: true },
    status: {
        type: String,
        enum: ['em preparo', 'pronto', 'cancelado'],
        default: 'em preparo'
    }
});

const pagementoSchema = new mongoose.Schema({
    formaPagamento: {
        type: String,
        enum: ['débito', 'crédito', 'pix', 'dinheiro', 'voucher', 'em aberto']
    },
    valor: { type: Number, required: true }

});

const methodsSchema = new mongoose.Schema({
    value: { type: Number, required: true },
    method: { type: String, enum: ['débito', 'crédito', 'pix', 'dinheiro', 'voucher'] },
    type: { type: String, enum: ['online', 'offline'] },

});

const paymentSchema = new mongoose.Schema({
    prepaid: { type: Number },
    pending: { type: Number },
    methods: [methodsSchema],

});

const deliverySchema = new mongoose.Schema({
    mode: { type: String, enum: ['DEFAULT', 'EXPRESS', 'HIGH_DENSITY', 'TURBO'], default: 'DEFAULT' },
    deliveredBy: { type: String, enum: ['ifood', 'loja'], default: 'loja' },
    observations: { type: String },
    pickupCode: { type: String },
    deliveryAddress: {
        streetName: { type: String, required: true },
        streetNumber: { type: String },
        neighborhood: { type: String, required: true },
        complement: { type: String },
        reference: { type: String },
        postalCode: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    },
    deliveryFee: { type: Number, default: 0 }, // Taxa de entrega
    deliveryTime: { type: Number }, // Tempo estimado de entrega em minutos
    deliveryAreaId: { type: mongoose.Schema.Types.ObjectId, ref: "areaentregas" },
    deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "entregadores" }
});

const DestinoImpressaoSchema = new mongoose.Schema({
    estacao: { type: String, enum: ["cozinha", "expedicao"], required: true, index: true },
    imprimir: { type: Boolean, default: false, index: true },
    requisicaoImpressao: { type: Date, default: null, index: true },
    impressoEm: { type: Date, default: null },
    copias: { type: Number, default: 1, min: 1, max: 4 },
    tentativas: { type: Number, default: 0 }
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    idExterno: String,
    nomeCliente: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'consumidores', required: false },
    valorTotal: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    desconto: { type: Number, default: 0, min: 0 },
    // horario: { type: Date, default: Date.now },
    numeroPedido: { type: Number, required: true },
    destinosImpressao: { type: [DestinoImpressaoSchema], default: [] },
    delivery: { type: deliverySchema },
    status: {
        type: String,
        enum: ['pagamento pendente', 'novo', 'em preparo', 'pronto', 'entregando', 'concluído', 'cancelado'],
        default: 'em preparo'
    },
    tipoPedido: {
        type: String,
        enum: ['comer aqui', 'para viagem', 'delivery'],
        required: true
    },
    origem: {
        type: String,
        enum: ['pdv', 'cardápio-digital', 'whatsapp', 'ifood', 'instagram'],
        default: 'pdv'
    },
    intencaoPagamento: {
        type: String,
        enum: ['offline', 'online'],
        required: function () {
            return this.origem === 'cardápio-digital';
        }
    },
    formaPagamentoPretendida: {
        type: String,
        enum: ['cartao', 'pix', 'dinheiro'],
        required: function () {
            return this.origem === 'cardápio-digital';
        }
    },
    pagamentoOnlineConfirmado: {
        type: Boolean,
        default: false
    },
    paymentIntentId: {
        type: String
    },
    pagamentos: [pagementoSchema],
    pagamento: { type: paymentSchema },
    valorPago: { type: Number, default: 0 },
    valorFiado: { type: Number, default: 0 },
    itens: [itemPedidoSchema],
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "cliente", required: true },
}, { timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// TESTANDO LINHA ABAIXO
// Adicionar depois 
// "destinosImpressao.estacao": 1,
//   "destinosImpressao.imprimir": 1,
//   "destinosImpressao.requisicaoImpressao": 1
pedidoSchema.index({ clienteId: 1, numeroPedido: 1 }, { unique: true });

pedidoSchema.virtual('quantidadeItens').get(function () {
    return this.itens.reduce((total, item) => total + item.quantidade, 0);
});


const pedido = mongoose.model("pedidos", pedidoSchema);

export default pedido;