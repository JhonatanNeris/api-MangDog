import NaoEncontrado from "../erros/NaoEncontrado.js";
import { entregador } from "../models/index.js";

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
                status,              // opcional: ex. 'entregue', 'finalizado'...
                incluirInativos = 'true'
            } = req.query;

            if (!dataInicio || !dataFim) {
                return res.status(400).json({ erro: 'dataInicio e dataFim são obrigatórios (YYYY-MM-DD).' });
            }

            // monta datas com timezone fixo -03:00 (ajuste se necessário)
            const [hiH, hiM] = horarioInicio.split(':').map(Number);
            const [hfH, hfM] = horarioFim.split(':').map(Number);

            const inicio = new Date(`${dataInicio}T${String(hiH).padStart(2, '0')}:${String(hiM).padStart(2, '0')}:00-03:00`);
            const fim = new Date(`${dataFim}T${String(hfH).padStart(2, '0')}:${String(hfM).padStart(2, '0')}:59.999-03:00`);

            // filtros de entregadores
            const matchEntregador = {};
            if (busca.trim()) {
                matchEntregador.$or = [
                    { nome: { $regex: busca.trim(), $options: 'i' } },
                    { telefone: { $regex: busca.trim(), $options: 'i' } },
                ];
            }
            if (incluirInativos !== 'true') {
                matchEntregador.ativo = true;
            }

            // filtros de pedidos dentro do $lookup (pré-agregados)
            const matchPedidos = {
                tipoPedido: 'delivery',
                createdAt: { $gte: inicio, $lte: fim },
                status: { $ne: 'cancelado' }
            };
            if (status) matchPedidos.status = status;

            const pipeline = [
                { $match: matchEntregador },

                {
                    $lookup: {
                        from: 'pedidos',
                        let: { entregadorId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$entregadorId', '$$entregadorId'] },
                                    ...matchPedidos
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    quantidade: { $sum: 1 },
                                    totalPedidos: { $sum: '$valorTotal' },
                                    totalTaxaEntrega: { $sum: { $ifNull: ['$delivery.deliveryFee', 0] } }
                                }
                            }
                        ],
                        as: 'resumo'
                    }
                },

                // "resumo" vem como array [ {...} ] ou []
                {
                    $addFields: {
                        entregasConcluidas: {
                            quantidade: { $ifNull: [{ $arrayElemAt: ['$resumo.quantidade', 0] }, 0] },
                            totalPedidos: { $ifNull: [{ $arrayElemAt: ['$resumo.totalPedidos', 0] }, 0] },
                            totalTaxaEntrega: { $ifNull: [{ $arrayElemAt: ['$resumo.totalTaxaEntrega', 0] }, 0] },
                        }
                    }
                },
                {
                    $addFields: {
                        mediaPorEntrega: {
                            $cond: [
                                { $gt: ['$entregasConcluidas.quantidade', 0] },
                                { $divide: ['$entregasConcluidas.totalPedidos', '$entregasConcluidas.quantidade'] },
                                0
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        nome: 1,
                        telefone: 1,
                        ativo: 1,
                        entregasConcluidas: 1,
                        mediaPorEntrega: 1
                    }
                },
                { $sort: { nome: 1 } }
            ];

            const data = await entregador.aggregate(pipeline);
            res.json({ periodo: { inicio, fim }, filtros: { busca, status }, data });
        } catch (e) {
            console.error(e);
            res.status(500).json({ erro: 'Falha ao gerar resumo de entregadores.' });
        }

    }

}

export default EntregadorController;
