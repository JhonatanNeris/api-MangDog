import mongoose from "mongoose";

const entregadorSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    telefone: {
        type: String,
        required: true,
        trim: true
    },
    localizacaoAtual: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    ativo: {
        type: Boolean,
        default: true
    },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cliente',
        required: true
    }
}, {
    timestamps: true, versionKey: false
});

const entregador = mongoose.model("entregadores", entregadorSchema);

export default entregador;
