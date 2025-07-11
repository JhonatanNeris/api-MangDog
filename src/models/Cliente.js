import mongoose from "mongoose"

const ClienteSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    nome: { type: String, required: true },
    cnpj: { type: String, unique: true },
    tema: { type: String, default: "padrão" },
    logoUrl: { type: String },
    emailContato: { type: String, required: true },
    telefoneContato: { type: String, required: true },
    stripeCustomerId: { type: String },
    stripeAccountId: { type: String },
    stripeStatus: {
        type: String,
        enum: ['nao-criado', 'pendente', 'completo'],
        default: 'nao-criado'
    },
    plano: { type: String, enum: ["basico", "bruto"] },
    slug: { type: String, unique: true },
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
