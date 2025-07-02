import { configuracoes } from "../models/index.js";

class ConfiguracoesController {

    static async getPorCliente(req, res, next) {
        try {
            const { clienteId } = req.params;

            const config = await configuracoes.findOne({ clienteId });

            if (!config) {
                return res.status(404).json({ erro: "Configuração não encontrada." });
            }

            res.status(200).json(config);
        } catch (error) {
            next(error);
        }
    }

    static async postConfiguracoes(req, res, next) {

        try {
            const { clienteId } = req.body;

            const jaExiste = await configuracoes.findOne({ clienteId });

            if (jaExiste) {
                return res.status(400).json({ erro: "Configuração já existe para este cliente." });
            }

            const novaConfig = new configuracoes(req.body);
            await novaConfig.save();

            res.status(201).json(novaConfig);
        } catch (error) {
            next(error);
        }
    }

    // Atualizar configuração por clienteId
    static async putConfiguracoes(req, res, next) {
        try {
            const clienteId = req.usuario.clienteId;

            const atualizada = await configuracoes.findOneAndUpdate(
                { clienteId },
                { $set: req.body },
                { new: true, runValidators: true, upsert: true }
            );

            if (!atualizada) {
                return res.status(404).json({ erro: "Configuração não encontrada." });
            }

            res.status(200).json(atualizada);
        } catch (error) {
            next(error);
        }
    }
}

export default ConfiguracoesController