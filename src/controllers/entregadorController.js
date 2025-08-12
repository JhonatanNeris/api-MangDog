import NaoEncontrado from "../erros/NaoEncontrado.js";
import { entregador } from "../models/index.js";
import mongoose from "mongoose";

class EntregadorController {

    static async listarEntregadores(req, res, next) {

        try {
            const resultado = await entregador.find({ clienteId: req.usuario.clienteId });
            console.log("Listando entregadores do cliente:", resultado);
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

    static async getResumoEntregadores(req, res, next) {

        try {
            const {
                busca = '',
                dataInicio,
                dataFim,
                horarioInicio = '00:00',
                horarioFim = '23:59',
                entregadorId,
                incluirInativos = 'true'
            } = req.query;

            if (!dataInicio || !dataFim) {
                return res.status(400).json({ erro: 'dataInicio e dataFim são obrigatórios (YYYY-MM-DD).' });
            }

            const [hiH, hiM] = horarioInicio.split(':').map(Number);
            const [hfH, hfM] = horarioFim.split(':').map(Number);

            const inicio = new Date(`${dataInicio}T${String(hiH).padStart(2, '0')}:${String(hiM).padStart(2, '0')}:00-03:00`);
            const fim = new Date(`${dataFim}T${String(hfH).padStart(2, '0')}:${String(hfM).padStart(2, '0')}:59.999-03:00`);

            const matchEntregador = { clienteId: req.usuario.clienteId };
            if (busca.trim()) {
                matchEntregador.$or = [
                    { nome: { $regex: busca.trim(), $options: 'i' } },
                    { telefone: { $regex: busca.trim(), $options: 'i' } },
                ];
            }
            if (incluirInativos !== 'true') {
                matchEntregador.ativo = true;
            }
            if (entregadorId) {
                matchEntregador._id = new mongoose.Types.ObjectId(entregadorId);
            }

            const pipeline = [
                { $match: matchEntregador },
                {
                    $lookup: {
                        from: 'pedidos',
                        let: { entregadorId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$delivery.deliveryPersonId', '$$entregadorId'] },
                                    clienteId: req.usuario.clienteId,
                                    tipoPedido: 'delivery',
                                    createdAt: { $gte: inicio, $lte: fim }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'areaentregas',
                                    localField: 'delivery.deliveryAreaId',
                                    foreignField: '_id',
                                    as: 'area'
                                }
                            },
                            {
                                $addFields: {
                                    taxaEntregador: {
                                        $cond: [
                                            { $gt: [{ $size: '$area' }, 0] },
                                            { $ifNull: [{ $arrayElemAt: ['$area.valorPagoEntregador', 0] }, 0] },
                                            { $ifNull: ['$delivery.deliveryFee', 0] }
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalEntregas: { $sum: 1 },
                                    concluidas: { $sum: { $cond: [{ $eq: ['$status', 'concluído'] }, 1, 0] } },
                                    canceladas: { $sum: { $cond: [{ $eq: ['$status', 'cancelado'] }, 1, 0] } },
                                    pendentes: { $sum: { $cond: [{ $in: ['$status', ['concluído', 'cancelado']] }, 0, 1] } },
                                    totalTaxas: { $sum: '$taxaEntregador' }
                                }
                            }
                        ],
                        as: 'resumo'
                    }
                },
                {
                    $addFields: {
                        totalEntregas: { $ifNull: [{ $arrayElemAt: ['$resumo.totalEntregas', 0] }, 0] },
                        entregasConcluidas: { $ifNull: [{ $arrayElemAt: ['$resumo.concluidas', 0] }, 0] },
                        entregasCanceladas: { $ifNull: [{ $arrayElemAt: ['$resumo.canceladas', 0] }, 0] },
                        entregasPendentes: { $ifNull: [{ $arrayElemAt: ['$resumo.pendentes', 0] }, 0] },
                        totalTaxas: { $ifNull: [{ $arrayElemAt: ['$resumo.totalTaxas', 0] }, 0] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        nome: 1,
                        telefone: 1,
                        ativo: 1,
                        totalEntregas: 1,
                        entregasConcluidas: 1,
                        entregasCanceladas: 1,
                        entregasPendentes: 1,
                        totalTaxas: 1
                    }
                },
                { $sort: { nome: 1 } }
            ];

            const data = await entregador.aggregate(pipeline);
            res.json({ periodo: { inicio, fim }, filtros: { busca, entregadorId }, data });
        } catch (e) {
            console.error(e);
            res.status(500).json({ erro: 'Falha ao gerar resumo de entregadores.' });
        }

    }

}

export default EntregadorController;
