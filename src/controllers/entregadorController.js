import NaoEncontrado from "../erros/NaoEncontrado.js";
import { entregador, pedido } from "../models/index.js";
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

            /** @type {string} */
            let clienteId = req.usuario.clienteId;
            // Verifica se o clienteId é um ObjectId válido
            if (mongoose.isValidObjectId(clienteId)) {
                clienteId = new mongoose.Types.ObjectId(String(clienteId));
            }

            // ---- período padrão = hoje ----
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            const di = dataInicio || `${y}-${m}-${d}`;
            const df = dataFim || `${y}-${m}-${d}`;

            const [hiH, hiM] = (horarioInicio || '00:00').split(':').map(Number);
            const [hfH, hfM] = (horarioFim || '23:59').split(':').map(Number);

            const inicio = new Date(`${di}T${String(hiH).padStart(2, '0')}:${String(hiM).padStart(2, '0')}:00-03:00`);
            const fim = new Date(`${df}T${String(hfH).padStart(2, '0')}:${String(hfM).padStart(2, '0')}:59.999-03:00`);

            // ---- filtros entregadores ----
            const matchEntregador = { clienteId };
            if (busca.trim()) {
                matchEntregador.$or = [
                    { nome: { $regex: busca.trim(), $options: 'i' } },
                    { telefone: { $regex: busca.trim(), $options: 'i' } },
                ];
            }
            if (incluirInativos !== 'true') matchEntregador.ativo = true;
            if (entregadorId) matchEntregador._id = new mongoose.Types.ObjectId(entregadorId);

            // ---- nomes de status conforme seu schema ----
            const STATUS_CONCLUIDO = 'concluído';
            const STATUS_CANCELADO = 'cancelado';
            const STATUS_EM_ROTA = 'entregando';

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
                                    clienteId,
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

                                    // Contagens
                                    concluidasCount: { $sum: { $cond: [{ $eq: ['$status', STATUS_CONCLUIDO] }, 1, 0] } },
                                    canceladasCount: { $sum: { $cond: [{ $eq: ['$status', STATUS_CANCELADO] }, 1, 0] } },
                                    pendentesCount: { $sum: { $cond: [{ $in: ['$status', [STATUS_CONCLUIDO, STATUS_CANCELADO]] }, 0, 1] } },
                                    emRotaCount: { $sum: { $cond: [{ $eq: ['$status', STATUS_EM_ROTA] }, 1, 0] } },

                                    // Valores dos pedidos
                                    concluidasValorPedidos: { $sum: { $cond: [{ $eq: ['$status', STATUS_CONCLUIDO] }, '$valorTotal', 0] } },
                                    canceladasValorPedidos: { $sum: { $cond: [{ $eq: ['$status', STATUS_CANCELADO] }, '$valorTotal', 0] } },
                                    pendentesValorPedidos: { $sum: { $cond: [{ $in: ['$status', [STATUS_CONCLUIDO, STATUS_CANCELADO]] }, 0, '$valorTotal'] } },
                                    emRotaValorPedidos: { $sum: { $cond: [{ $eq: ['$status', STATUS_EM_ROTA] }, '$valorTotal', 0] } },

                                    // Taxas do entregador
                                    concluidasTaxas: { $sum: { $cond: [{ $eq: ['$status', STATUS_CONCLUIDO] }, '$taxaEntregador', 0] } },
                                    canceladasTaxas: { $sum: { $cond: [{ $eq: ['$status', STATUS_CANCELADO] }, '$taxaEntregador', 0] } },
                                    pendentesTaxas: { $sum: { $cond: [{ $in: ['$status', [STATUS_CONCLUIDO, STATUS_CANCELADO]] }, 0, '$taxaEntregador'] } },
                                    emRotaTaxas: { $sum: { $cond: [{ $eq: ['$status', STATUS_EM_ROTA] }, '$taxaEntregador', 0] } },
                                }
                            }
                        ],
                        as: 'resumo'
                    }
                },

                { $addFields: { resumo: { $ifNull: [{ $arrayElemAt: ['$resumo', 0] }, {}] } } },
                {
                    $addFields: {
                        totalEntregas: {
                            $add: [
                                { $ifNull: ['$resumo.concluidasCount', 0] },
                                { $ifNull: ['$resumo.canceladasCount', 0] },
                                { $ifNull: ['$resumo.pendentesCount', 0] }
                            ]
                        },

                        entregasConcluidas: {
                            quantidade: { $ifNull: ['$resumo.concluidasCount', 0] },
                            valorPedidos: { $ifNull: ['$resumo.concluidasValorPedidos', 0] },
                            totalTaxas: { $ifNull: ['$resumo.concluidasTaxas', 0] }
                        },
                        entregasPendentes: {
                            quantidade: { $ifNull: ['$resumo.pendentesCount', 0] },
                            valorPedidos: { $ifNull: ['$resumo.pendentesValorPedidos', 0] },
                            totalTaxas: { $ifNull: ['$resumo.pendentesTaxas', 0] }
                        },
                        entregasCanceladas: {
                            quantidade: { $ifNull: ['$resumo.canceladasCount', 0] },
                            valorPedidos: { $ifNull: ['$resumo.canceladasValorPedidos', 0] },
                            totalTaxas: { $ifNull: ['$resumo.canceladasTaxas', 0] }
                        },
                        emRota: {
                            quantidade: { $ifNull: ['$resumo.emRotaCount', 0] },
                            valorPedidos: { $ifNull: ['$resumo.emRotaValorPedidos', 0] },
                            totalTaxas: { $ifNull: ['$resumo.emRotaTaxas', 0] }
                        }
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
                        entregasPendentes: 1,
                        entregasCanceladas: 1,
                        emRota: 1
                    }
                },
                { $sort: { nome: 1 } }
            ];

            const data = await entregador.aggregate(pipeline);
            res.json({ periodo: { inicio, fim }, filtros: { busca, entregadorId, incluirInativos }, data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ erro: 'Falha ao gerar resumo de entregadores.' });
        }
    }
}

export default EntregadorController;
