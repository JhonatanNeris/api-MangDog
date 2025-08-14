// auth/authImpressao.js
import cliente from '../models/Cliente.js';
import { sha256 } from '../utils/tokenImpressao.js';

export async function authImpressao(req, res, next) {
    try {
        const hdr = req.header("authorization") || "";
        const [type, token] = hdr.split(" ");
        if ((type || "").toLowerCase() !== "bearer" || !token) {
            return res.status(401).json({ message: "Token ausente" });
        }
        // Você precisa informar de onde vem o clienteId do restaurante:
        // pode estar no sub do JWT do painel, no domínio, ou vir em header fixo.
        // Para o app local, recomendo mandar também um header "x-cliente-id".
        const clienteId = req.header("x-cliente-id");
        if (!clienteId) return res.status(400).json({ message: "x-cliente-id ausente" });

        // precisamos do hash → usar +select
        const cli = await cliente.findById(clienteId).select("+tokenImpressao.hash tokenImpressao.ativo tokenImpressao.revogadoEm");
        if (!cli || !cli.tokenImpressao) return res.status(401).json({ message: "Cliente sem token" });

        if (cli.tokenImpressao.revogadoEm || !cli.tokenImpressao.ativo) {
            return res.status(401).json({ message: "Token revogado/inativo" });
        }

        const ok = cli.tokenImpressao.hash && cli.tokenImpressao.hash === sha256(token);
        if (!ok) return res.status(401).json({ message: "Token inválido" });

        // atualiza último uso (não bloqueante)
        cliente.updateOne(
            { _id: cli._id },
            { $set: { "tokenImpressao.ultimoUsoEm": new Date() } }
        ).catch(() => { });

        req.impressao = { clienteId: String(cli._id) };
        next();
    } catch (e) {
        next(e);
    }
}