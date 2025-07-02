import mongoose from "mongoose"

const FormaPagamentoSchema = new mongoose.Schema({
    formaPagamento: { type: String },
    formaPagamentoAtiva: { type: Boolean, default: false }
}, { _id: false });


const ConfiguracoesSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "cliente", required: true, unique: true }, // Referência ao cliente
    pedidos: {
        sequencia: { type: Number, default: 0 }
    },
    monitorKds: {
        contadores: [{
            nome: { type: String, required: true },
            ativo: { type: Boolean, default: true },
            produtosPrincipais: [{ type: mongoose.Types.ObjectId, ref: 'produto' }],
            produtosAdicionais: [{ type: mongoose.Types.ObjectId, ref: 'produto' }],
        }]
    },
    cardapioDigital: {
        cardapioAtivo: { type: Boolean, default: false },
        temaCardapio: {
            corPrimaria: { type: String },
            corSecundaria: { type: String }
        },
        pagamento: {
            online: {
                ativo: { type: Boolean, default: false },
                formasPagamento: [FormaPagamentoSchema]

            }, local: {
                ativo: { type: Boolean, default: true },
                formasPagamento: [FormaPagamentoSchema]
            },

        }

    },
    horarioFuncionamento: {
        dias: [
            {
                diaSemana: {
                    type: String,
                    enum: ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'],
                },
                aberto: { type: Boolean, default: true },
                turnos: [
                    {
                        horarioAbertura: { type: String },
                        horarioFechamento: { type: String },
                    }
                ]
            }
        ],
        diasFechadosEspeciais: [{ type: Date }]
    },


}, { versionKey: false, timestamps: true });

const configuracoes = mongoose.model("configuracoes", ConfiguracoesSchema);

export default configuracoes;
