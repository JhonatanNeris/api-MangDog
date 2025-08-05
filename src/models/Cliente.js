import mongoose from "mongoose"

const ClienteSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    cnpj: { type: String, unique: true },
    tema: { type: String, default: "padrão" },
    emailContato: { type: String, required: true },
    telefoneContato: { type: String, required: true },
    loja: {
        nome: { type: String, required: true },
        slug: { type: String, unique: true },
        logoUrl: { type: String },
        descricao: { type: String },
        telefone: { type: String },
        pedidoMinimo: { type: Number },
        endereco: {
            logradouro: { type: String, required: true },
            numero: { type: String },
            bairro: { type: String, required: true },
            complemento: { type: String, required: true },
            referencia: { type: String },
            cep: { type: String, required: true },
            cidade: { type: String, required: true },
            estado: { type: String, required: true },
            pais: { type: String, default: "BR" },
            coordenadas: {
                latitude: { type: Number },
                longitude: { type: Number }
            }
        }

    },
    stripeCustomerId: { type: String },
    stripeAccountId: { type: String },
    stripeStatus: {
        type: String,
        enum: ['nao-criado', 'pendente', 'completo'],
        default: 'nao-criado'
    },
    plano: { type: String, enum: ["basico", "bruto"] },
    assinaturaAtiva: { type: Boolean, default: false },
    integracaoIfood: {
        ativo: { type: Boolean, default: false },
        accessToken: String,
        refreshToken: String,
        tokenExpiresAt: Date,
        idLojaIfood: String,
        // webhookUrl: String,
        ultimoPedidoImportado: Date,
    },
    criadoEm: { type: Date, default: Date.now },
}, { versionKey: false });

const cliente = mongoose.model("cliente", ClienteSchema);

export default cliente;
