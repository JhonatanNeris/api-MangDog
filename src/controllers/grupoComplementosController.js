import { grupoComplementos } from "../models/index.js";

class GrupoComplementosController {

    static async getGrupoComplementos(req, res, next) {
        try {
            const listaGrupoComplementos = await grupoComplementos.find({ clienteId: req.usuario.clienteId })
            res.status(200).json(listaGrupoComplementos);
        } catch (error) {
            next(error);
        }
    }

    static async getGrupoComplementosId(req, res, next) {
        try {
            const id = req.params.id
            const GrupoComplementosEncontrado = await grupoComplementos.findOne({
                _id: id,
                clienteId: req.usuario.clienteId
            })

            if (GrupoComplementosEncontrado !== null) {
                res.status(200).json(GrupoComplementosEncontrado);
            } else {
                next(new NaoEncontrado(`Id do grupo não localizado!`))
            }
        } catch (error) {
            next(error);
        }
    }

    static async getComplementosPorGrupos(req, res, next) {
        try {
            const ids = req.query.ids?.split(',') || [];

            if (!ids.length) {
                return res.status(400).json({ message: "IDs de grupo de complementos são obrigatórios" });
            }

            const grupos = await grupoComplementos.find({
                _id: { $in: ids },
                clienteId: req.usuario.clienteId
            }).populate('adicionais'); // <--- populando os adicionais se for referência

            // Junta todos os adicionais de todos os grupos
            const todosAdicionais = grupos.flatMap(grupo => grupo.adicionais);

            res.status(200).json(todosAdicionais);
        } catch (error) {
            next(error);
        }
    }

    static async getGrupoComplementosPorIds(req, res, next) {
        try {
            const ids = req.query.ids?.split(',') || [];

            if (!ids.length) {
                return res.status(400).json({ message: "IDs são obrigatórios" });
            }

            const grupos = await grupoComplementos.find({
                _id: { $in: ids },
                clienteId: req.usuario.clienteId
            });

            res.status(200).json(grupos);
        } catch (error) {
            next(error);
        }
    }



    static async postGrupoComplementos(req, res, next) {
        try {
            const novoGrupoComplementos = await grupoComplementos.create({
                ...req.body,
                clienteId: req.usuario.clienteId
            })
            res.status(201).json({ message: 'Cadastrado com sucesso!', GrupoComplementos: novoGrupoComplementos })
        } catch (error) {
            next(error);
        }
    }

    static async putGrupoComplementos(req, res, next) {

        try {
            const id = req.params.id
            const grupoComplementosAtualizado = await grupoComplementos.findOneAndUpdate({ _id: id, clienteId: req.usuario.clienteId }, req.body)

            if (grupoComplementosAtualizado !== null) {
                res.status(200).json({ message: "Grupo de complementos atualizado!" })
            } else {
                next(new NaoEncontrado('Id do grupo de complementos não localizado'))
            }

        } catch (error) {
            next(error);
        }

    }

    static async deleteGrupoComplementos(req, res, next) {

        try {
            const id = req.params.id
            const grupoComplementosApagado = await grupoComplementos.findOneAndDelete({
                _id: id,
                clienteId: req.usuario.clienteId
            })

            if (grupoComplementosApagado !== null) {
                res.status(200).json({ message: "Grupo de complementos excluído!" })
            } else {
                next(new NaoEncontrado('Id do grupo de complementos não localizado'))
            }

        } catch (error) {
            next(error);
        }

    }
}

export default GrupoComplementosController;