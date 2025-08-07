import NaoEncontrado from "../erros/NaoEncontrado.js";
import { areaEntrega } from "../models/index.js";

class AreaEntregaController {

    static async listarAreasEntrega(req, res, next) {

        try {
            const resultado = await areaEntrega.find({ clienteId: req.usuario.clienteId })
            res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }

    }

    static async listarAreaEntregaPorId(req, res, next) {

        try {
            const id = req.params.id
            const areaEntregaEncontrada = await areaEntrega.findOne({
                _id: id,
                clienteId: req.usuario.clienteId
            })

            if (areaEntregaEncontrada !== null) {
                res.status(200).send(areaEntregaEncontrada);
            } else {
                next(new NaoEncontrado(`Id da área não localizado!`))
            }

        } catch (error) {
            next(error)
        }

    }

    static async postAreaEntrega(req, res, next) {

        try {
            const novaAreaEntrega = await areaEntrega.create({
                ...req.body,
                clienteId: req.usuario.clienteId
            })
            res.status(201).json({ message: 'Cadastrado com sucesso!', areaEntrega: novaAreaEntrega })
        } catch (error) {
            next(error);
        }
    }

    static async putAreaEntrega(req, res, next) {

        try {
            const id = req.params.id
            const areaEntregaAtualizada = await areaEntrega.findOneAndUpdate({ _id: id, clienteId: req.usuario.clienteId }, req.body)

            if (areaEntregaAtualizada !== null) {
                res.status(200).json({ message: "Área de entrega atualizada!"})
            } else {
                next(new NaoEncontrado('Id da área não localizado'))
            }

        } catch (error) {
            next(error);
        }

    }

    static async deleteAreaEntrega(req, res, next) {

        try {
            const id = req.params.id
            const areaEntregaDeletada = await areaEntrega.findOneAndDelete({
                _id: id,
                clienteId: req.usuario.clienteId
            })

            if (areaEntregaDeletada !== null) {
                res.status(200).json({ message: "Área de entrega excluída!" })
            } else {
                next(new NaoEncontrado('Id da área não localizado'))
            }

        } catch (error) {
            next(error);
        }

    }

}

export default AreaEntregaController;