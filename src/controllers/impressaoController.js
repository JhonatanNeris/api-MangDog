import { pedido, configuracoes, cliente } from '../models/index.js';
import { generateOpaqueToken, sha256 } from '../utils/tokenImpressao.js';

class ImpressaoController {
    static async criarTokenImpressao(req, res) {
        try {
            const clienteId = req.usuario.clienteId;
            if (!clienteId) return res.status(400).json({ message: "clienteId é obrigatório" });

            const tokenClaro = generateOpaqueToken(48);
            const hash = sha256(tokenClaro);

            const clienteAtualizado = await cliente.findByIdAndUpdate(
                clienteId,
                {
                    $set: {
                        "tokenImpressao.hash": hash,
                        "tokenImpressao.criadoEm": new Date(),
                        "tokenImpressao.revogadoEm": null,
                        "tokenImpressao.ativo": true
                    }
                },
                { new: true }
            );

            if (!clienteAtualizado) return res.status(404).json({ message: "Cliente não encontrado" });
            return res.json({
                ok: true,
                token: tokenClaro, // <-- mostrar ao usuário uma única vez
                clienteId: String(clienteAtualizado._id),
                loja: clienteAtualizado.loja?.nome
            });



        } catch (error) {
            console.error("Erro ao criar token de impressão:", error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    }

    static async revogarTokenImpressao(req, res) {
        try {
            const clienteId = req.usuario.clienteId;
            if (!clienteId) return res.status(400).json({ message: "clienteId é obrigatório" });

            const cli = await cliente.findByIdAndUpdate(
                clienteId,
                { $set: { "tokenImpressao.revogadoEm": new Date(), "tokenImpressao.ativo": false } },
                { new: true }
            );
            if (!cli) return res.status(404).json({ message: "Cliente não encontrado" });

            res.json({ ok: true });
        } catch (e) { next(e); }
    }

    static async statusTokenImpressao(req, res) {
        try {
            const clienteId = req.usuario.clienteId;
            if (!clienteId) return res.status(400).json({ message: "clienteId é obrigatório" });

            // NÃO selecione o hash
            const cli = await cliente.findById(clienteId)
                .select("loja.nome tokenImpressao.criadoEm tokenImpressao.revogadoEm tokenImpressao.ativo updatedAt");

            if (!cli) return res.status(404).json({ message: "Cliente não encontrado" });

            const hasToken = !!cli.tokenImpressao?.criadoEm && !cli.tokenImpressao?.revogadoEm && !!cli.tokenImpressao?.ativo;

            res.json({
                hasToken,
                ativo: !!cli.tokenImpressao?.ativo,
                criadoEm: cli.tokenImpressao?.criadoEm,
                revogadoEm: cli.tokenImpressao?.revogadoEm,
                loja: cli.loja?.nome,
                updatedAt: cli.updatedAt
            });
        } catch (e) { next(e); }
    }

    static async getPedidosImpressao(req, res) {
        try {
            const clienteId = req.impressao.clienteId;
            const sinceStr = String(req.query.since || "");
            const estacoesParam = String(req.query.estacoes || "");
            const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));

            const since = isFinite(Date.parse(sinceStr)) ? new Date(sinceStr) : new Date(0);
            const estacoes = estacoesParam ? estacoesParam.split(",") : ["cozinha", "expedicao"];

            const filtro = {
                clienteId,
                "destinosImpressao": {
                    $elemMatch: {
                        estacao: { $in: estacoes },
                        imprimir: true,
                        requisicaoImpressao: { $gt: since }
                    }
                }
            };

            const cli = await cliente.findById(clienteId)

            console.log(cli)

            const docs = await pedido.find(filtro)
                .sort({ "destinosImpressao.requisicaoImpressao": 1 })
                .limit(limit)
                .lean();

            const data = [];
            for (const p of docs) {
                const pend = (p.destinosImpressao || []).find(d =>
                    estacoes.includes(d.estacao) &&
                    d.imprimir === true &&
                    new Date(d.requisicaoImpressao) > since
                );
                if (!pend) continue;

                data.push({
                    nomeLoja: cli?.loja?.nome,
                    pedidoId: String(p._id),
                    numero: p.numeroPedido ?? undefined,
                    estacao: pend.estacao,
                    requisicaoImpressao: new Date(pend.requisicaoImpressao).toISOString(),
                    copias: Math.max(1, Math.min(pend.copias || 1, 5)),
                    payload: {
                        nomeCliente: p.nomeCliente,
                        numeroPedido: p.numeroPedido,
                        itens: p.itens,
                        totais: {
                            subtotal: p.subtotal,
                            desconto: p.desconto,
                            valorTotal: p.valorTotal,
                            taxaEntrega: p.delivery?.deliveryFee ?? 0
                        },
                        status: p.status,
                        criadoEm: p.createdAt,
                        mesa: p.mesa ?? null,
                        tipoPedido: p.tipoPedido ?? null,
                        pagamentos: p.pagamentos ?? [],
                        pagamento: p.pagamento ?? null,
                        delivery: p.delivery ?? null,
                        observacoes: p.obs ?? null
                    }
                });
            }

            res.json({ data, serverTime: new Date().toISOString() });
        } catch (e) {
            next(e);
        }
    }

    static async ackPedidoImpressao(req, res, next) {
        try {
            const clienteId = req.impressao?.clienteId; // vem do authImpressao
            if (!clienteId) return res.status(401).json({ message: "Não autenticado (agente)" });

            const { id } = req.params;
            const { estacao, status } = req.body || {};

            if (!["cozinha", "expedicao"].includes(estacao)) {
                return res.status(400).json({ message: "Estação inválida" });
            }
            if (!["impresso", "falha"].includes(status)) {
                return res.status(400).json({ message: "Status inválido" });
            }

            const p = await pedido.findOne({
                _id: id,
                clienteId
            });

            if (!p) return res.status(404).json({ message: "Pedido não encontrado" });

            const idx = (p.destinosImpressao || []).findIndex(d => d.estacao === estacao);
            if (idx < 0) {
                return res.status(400).json({ message: "Estação não configurada para este pedido" });
            }

            if (status === "impresso") {
                p.destinosImpressao[idx].imprimir = false;
                p.destinosImpressao[idx].impressoEm = new Date();
                p.destinosImpressao[idx].tentativas = 0;
            } else {
                p.destinosImpressao[idx].tentativas = (p.destinosImpressao[idx].tentativas || 0) + 1;
            }

            await p.save();
            return res.json({ ok: true });
        } catch (e) {
            return next(e);
        }
    }

    static async enfileirarImpressao(req, res, next) {
        try {
            const clienteId = req.usuario?.clienteId; // vem do seu auth do painel
            if (!clienteId) return res.status(401).json({ message: "Não autenticado (painel)" });

            const { id } = req.params;
            let { estacoes, copias } = req.body || {};

            console.log("Enfileirar impressão:", { id, estacoes, copias });

            if (!Array.isArray(estacoes) || estacoes.length === 0) {
                return res.status(400).json({ message: "Informe ao menos uma estação" });
            }
            // valida e normaliza estações
            estacoes = estacoes.filter(e => ["cozinha", "expedicao"].includes(e));
            if (estacoes.length === 0) {
                return res.status(400).json({ message: "Nenhuma estação válida" });
            }

            const clamp = (n) => {
                const x = Number(n);
                if (!Number.isFinite(x) || x < 1) return 1;
                return Math.min(x, 5);
            };
            const copiasClamped = copias ? clamp(copias) : undefined;

            const p = await pedido.findOne({
                // _id: new mongoose.Types.ObjectId(id),
                // clienteId: new mongoose.Types.ObjectId(clienteId)
                _id: id,
                clienteId
            });
            if (!p) return res.status(404).json({ message: "Pedido não encontrado" });

            const now = new Date();

            for (const est of estacoes) {
                const idx = (p.destinosImpressao || []).findIndex(d => d.estacao === est);
                if (idx >= 0) {
                    p.destinosImpressao[idx].imprimir = true;
                    p.destinosImpressao[idx].requisicaoImpressao = now;
                    p.destinosImpressao[idx].tentativas = 0;
                    if (copiasClamped) p.destinosImpressao[idx].copias = copiasClamped;
                } else {
                    p.destinosImpressao.push({
                        estacao: est,
                        imprimir: true,
                        requisicaoImpressao: now,
                        impressoEm: null,
                        copias: copiasClamped || 1,
                        tentativas: 0
                    });
                }
            }

            await p.save();
            return res.json({ ok: true, enfileiradoPara: estacoes });
        } catch (e) {
            return next(e);
        }
    }

}

export default ImpressaoController;