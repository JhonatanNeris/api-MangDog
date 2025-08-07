import mongoose from "mongoose"

const areaEntregaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true, // Nome do bairro, ex: "Centro"
        trim: true
    },
    valorEntrega: {
        type: Number,
        required: true, // Valor cobrado do cliente, ex: 5.00
        default: 0
    },
    subsidioRestaurante: {
        type: Number,
        required: true, // Custo real para o restaurante, ex: 7.00 (5 + 2 para o motoboy)
        default: 0
    },
    valorPagoEntregador: {
        type: Number,
        required: true, // Custo real para o restaurante, ex: 7.00 (5 + 2 para o motoboy)
        default: 0
    },
    tempoEstimadoMinutos: {
        type: Number, // Opcional: tempo estimado de entrega para o bairro
    },
    ativo: {
        type: Boolean,
        default: true // Controla se o bairro está disponível para seleção
    },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cliente', // Restaurante dono dessa área
        required: true
    },
    ceps: {
        type: [String], // Lista de CEPs cobertos (útil para bairros grandes ou sobrepostos)
        default: []
    }
}, {
    timestamps: true, versionKey: false // ✅ Isso já cria createdAt e updatedAt automaticamente
});

const areaEntrega = mongoose.model("areaEntrega", areaEntregaSchema);

export default areaEntrega