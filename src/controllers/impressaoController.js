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
                    pedidoId: String(p._id),
                    numero: p.numero ?? p.sequencia ?? undefined,
                    estacao: pend.estacao,
                    requisicaoImpressao: new Date(pend.requisicaoImpressao).toISOString(),
                    copias: Math.max(1, Math.min(pend.copias || 1, 5)),
                    payload: {
                        nomeCliente: p.nomeCliente,
                        itens: p.itens,
                        totais: p.totais,
                        status: p.status,
                        criadoEm: p.createdAt,
                        mesa: p.mesa ?? null,
                        tipoPedido: p.tipoPedido ?? null,
                        pagamentos: p.pagamentos ?? [],
                        observacoes: p.obs ?? null
                    }
                });
            }

            res.json({ data, serverTime: new Date().toISOString() });
        } catch (e) {
            next(e);
        }
    }

}

export default ImpressaoController;