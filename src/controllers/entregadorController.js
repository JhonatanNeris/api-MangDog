import NaoEncontrado from "../erros/NaoEncontrado.js";
import { entregador } from "../models/index.js";

class EntregadorController {

    static async listarEntregadores(req, res, next) {

        try {
            const resultado = await entregador.find({ clienteId: req.usuario.clienteId });
            res.status(200).json(resultado);
        } catch (error) {
            next(error);
        }

    }

    static async listarEntregadorPorId(req, res, next) {

        try {
            const id = req.params.id;
            const entregadorEncontrado = await entregador.findOne({
                _id: id,
                clienteId: req.usuario.clienteId
            });

            if (entregadorEncontrado !== null) {
                res.status(200).send(entregadorEncontrado);
            } else {
                next(new NaoEncontrado("Id do entregador não localizado!"));
            }

        } catch (error) {
            next(error);
        }

    }

    static async postEntregador(req, res, next) {

        try {
            const novoEntregador = await entregador.create({
                ...req.body,
                clienteId: req.usuario.clienteId
            });
            res.status(201).json(novoEntregador);
        } catch (error) {
            next(error);
        }
    }

    static async putEntregador(req, res, next) {

        try {
            const id = req.params.id;
            const entregadorAtualizado = await entregador.findOneAndUpdate({ _id: id, clienteId: req.usuario.clienteId }, req.body, { new: true });

            if (entregadorAtualizado !== null) {
                res.status(200).json(entregadorAtualizado);
            } else {
                next(new NaoEncontrado('Id do entregador não localizado'));
            }

        } catch (error) {
            next(error);
        }

    }

    static async deleteEntregador(req, res, next) {

        try {
            const id = req.params.id;
            const entregadorDeletado = await entregador.findOneAndDelete({
                _id: id,
                clienteId: req.usuario.clienteId
            });

            if (entregadorDeletado !== null) {
                res.status(200).json({ message: "Entregador excluído!" });
            } else {
                next(new NaoEncontrado('Id do entregador não localizado'));
            }

        } catch (error) {
            next(error);
        }

    }

}

export default EntregadorController;
