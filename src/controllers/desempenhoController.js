import { pedido } from '../models/index.js';
import mongoose from 'mongoose';

class desempenhoController {

    static async getDesempenho(req, res, next) {

        try {

            const { dia, mes, ano } = req.query;
            const data = new Date();

            const anoAtual = ano ? parseInt(ano) : data.getFullYear();
            const mesAtual = mes ? parseInt(mes) - 1 : data.getMonth(); // mês é zero-indexed
            const diaAtual = dia ? parseInt(dia) : data.getDate();

            const inicioDia = new Date(anoAtual, mesAtual, diaAtual, 5, 0, 0); // 5h00 do dia atual
            const fimDia = new Date(inicioDia);
            fimDia.setDate(fimDia.getDate() + 1); // 4h59 do dia seguinte

            let clienteId = req.usuario.clienteId;

            // 🔹 Converta para ObjectId se necessário
            if (mongoose.isValidObjectId(clienteId)) {
                clienteId = new mongoose.Types.ObjectId(clienteId);
            }

            console.log("Cliente ID convertido:", clienteId); // ✅ LOG IMPORTANTE

            const condicoes = { clienteId: clienteId };
            if (dia) {
                condicoes.createdAt = {
                    $gte: new Date(anoAtual, mesAtual, diaAtual, 5, 0, 0), // Início do dia
                    $lt: new Date(anoAtual, mesAtual, diaAtual + 1, 4, 59, 0), // Início do dia seguinte
                };
            } else if (mes) {
                condicoes.createdAt = {
                    $gte: new Date(anoAtual, mesAtual, 1, 0, 0, 0), // Início do mês
                    $lt: new Date(anoAtual, mesAtual + 1, 1, 0, 0, 0), // Início do próximo mês
                };
            } else {
                condicoes.createdAt = {
                    $gte: new Date(anoAtual, mesAtual, 1, 0, 0, 0),
                    $lt: new Date(anoAtual, mesAtual + 1, 1, 0, 0, 0),
                };
            }

            console.log("Condições de Filtro:", condicoes); // Adicionando log

            const vendas = await pedido.aggregate([
                { $match: condicoes },
                {
                    $group: {
                        _id: null,
                        totalVendas: { $sum: "$valorTotal" },
                        quantidadePedidos: { $sum: 1 },
                    },
                },
            ]);

            const resultado = vendas[0] || { totalVendas: 0, quantidadePedidos: 0 };

            res.status(200).json({
                totalVendas: resultado.totalVendas,
                quantidadePedidos: resultado.quantidadePedidos,
            });
        } catch (error) {
            console.error("Erro ao obter desempenho:", error); // Log do erro
            next(error);
        }

    }

    static async getDesempenhoDiario(req, res, next) {

        try {
            const { dia, mes, ano } = req.query;
            const data = new Date();

            let anoAtual = ano ? parseInt(ano) : data.getFullYear();
            let mesAtual = mes ? parseInt(mes) - 1 : data.getMonth(); // mês é zero-indexed
            let diaAtual = dia ? parseInt(dia) : data.getDate();

            let clienteId = req.usuario.clienteId;

            // 🔹 Converta para ObjectId se necessário
            if (mongoose.isValidObjectId(clienteId)) {
                clienteId = new mongoose.Types.ObjectId(clienteId);
            }

            console.log("Cliente ID convertido:", clienteId); // ✅ LOG IMPORTANTE

            const condicoes = { clienteId: clienteId, status: { $ne: "cancelado" } };

            const horaAtual = data.getUTCHours();
            if (!dia && horaAtual < 8) {
                // Se for antes das 05:00 BRT (08:00 UTC), buscar o desempenho do dia anterior
                const ontem = new Date(anoAtual, mesAtual, diaAtual - 1);
                anoAtual = ontem.getFullYear();
                mesAtual = ontem.getMonth();
                diaAtual = ontem.getDate();
            }

            const inicioUTC = new Date(Date.UTC(anoAtual, mesAtual, diaAtual, 8, 0, 0)); // 05:00 BRT = 08:00 UTC
            const fimUTC = new Date(Date.UTC(anoAtual, mesAtual, diaAtual + 1, 7, 59, 59)); // 04:59 BRT = 07:59 UTC

            condicoes.createdAt = { $gte: inicioUTC, $lt: fimUTC };

            console.log("Condições de Filtro DIÁRIO:", JSON.stringify(condicoes, null, 2)); // ✅ LOG IMPORTANTE

            const vendas = await pedido.aggregate([
                { $match: condicoes },
                {
                    $group: {
                        _id: null,
                        totalVendas: { $sum: "$valorTotal" },
                        quantidadePedidos: { $sum: 1 },
                    },
                },
            ]);

            console.log("Resultado da consulta:", vendas); // ✅ LOG IMPORTANTE

            const resultado = vendas[0] || { totalVendas: 0, quantidadePedidos: 0 };

            res.status(200).json({
                totalVendas: resultado.totalVendas,
                quantidadePedidos: resultado.quantidadePedidos,
            });
        } catch (error) {
            console.error("Erro ao obter desempenho:", error); // Log do erro
            next(error);
        }

    }

    static async getDesempenhoPorPeriodo(req, res, next) {
        try {
            const { dataInicial, dataFinal } = req.query;

            if (!dataInicial || !dataFinal) {
                return res.status(400).json({ message: "Datas inicial e final são necessárias." });
            }

            const inicio = new Date(dataInicial);
            const fim = new Date(dataFinal);

            // Ajusta para o horário das 5h do início e das 4h59 do final
            inicio.setHours(5, 0, 0, 0);
            fim.setHours(4, 59, 59, 999);
            fim.setDate(fim.getDate() + 1);

            let clienteId = req.usuario.clienteId;

            // 🔹 Converta para ObjectId se necessário
            if (mongoose.isValidObjectId(clienteId)) {
                clienteId = new mongoose.Types.ObjectId(clienteId);
            }

            console.log("Cliente ID convertido:", clienteId); // ✅ LOG IMPORTANTE

            const condicoes = { clienteId: clienteId, createdAt: { $gte: inicio, $lt: fim }, status: { $ne: "cancelado" } };

            console.log("Condições de filtro po período: ", condicoes)

            const totaisPeriodo = await pedido.aggregate([
                { $match: condicoes },
                {
                    $group: {
                        _id: null,
                        totalVendas: { $sum: "$valorTotal" },
                        quantidadePedidos: { $sum: 1 }
                    }
                }
            ]);


            const resultado = totaisPeriodo[0] || { totalVendas: 0, quantidadePedidos: 0 };

            const ticketMedio = resultado.quantidadePedidos > 0
                ? resultado.totalVendas / resultado.quantidadePedidos
                : 0;

            const vendas = await pedido.aggregate([
                { $match: condicoes },

                {
                    $group: {
                        _id: {
                            dia: {
                                $dateToString: {
                                    format: "%d-%m-%Y",
                                    date: "$createdAt",
                                    timezone: "America/Sao_Paulo"
                                }
                            },
                            formaPagamento: "$formaPagamento",
                            diaOriginal: {
                                $dateTrunc: {
                                    date: "$createdAt",
                                    unit: "day",
                                    timezone: "America/Sao_Paulo"
                                }
                            }
                        },
                        totalVendas: { $sum: "$valorTotal" },
                        quantidadePedidos: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.dia",
                        diaOriginal: { $first: "$_id.diaOriginal" },
                        formasPagamento: {
                            $push: {
                                formaPagamento: "$_id.formaPagamento",
                                totalVendas: "$totalVendas",
                                quantidadePedidos: "$quantidadePedidos"
                            }
                        },
                        totalVendasDia: { $sum: "$totalVendas" },
                        quantidadePedidosDia: { $sum: "$quantidadePedidos" }
                    }
                },
                {
                    $sort: { "diaOriginal": 1 }  // Ordena por data
                }
            ]);

            const desempenho = {
                ...resultado,
                ticketMedio,
                detalhado: vendas.map(venda => ({
                    dia: venda._id,
                    formasPagamento: venda.formasPagamento,
                    totalVendasDia: venda.totalVendasDia,
                    quantidadePedidosDia: venda.quantidadePedidosDia
                }))
            }


            res.status(200).json(desempenho);
        } catch (error) {
            console.error("Erro ao obter desempenho:", error);
            next(error);
        }
    }


}



export default desempenhoController;