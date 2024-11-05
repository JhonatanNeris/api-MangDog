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

            const condicoes = {};

            if (dia) {
                condicoes.horario = {
                    $gte: new Date(anoAtual, mesAtual, diaAtual, 5, 0, 0), // Início do dia
                    $lt: new Date(anoAtual, mesAtual, diaAtual + 1, 4, 59, 0), // Início do dia seguinte
                };
            } else if (mes) {
                condicoes.horario = {
                    $gte: new Date(anoAtual, mesAtual, 1, 0, 0, 0), // Início do mês
                    $lt: new Date(anoAtual, mesAtual + 1, 1, 0, 0, 0), // Início do próximo mês
                };
            } else {
                condicoes.horario = {
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

            const anoAtual = ano ? parseInt(ano) : data.getFullYear();
            const mesAtual = mes ? parseInt(mes) - 1 : data.getMonth(); // mês é zero-indexed
            const diaAtual = dia ? parseInt(dia) : data.getDate();

            const condicoes = {};

            condicoes.horario = {
                $gte: new Date(anoAtual, mesAtual, diaAtual, 5, 0, 0),
                $lt: new Date(anoAtual, mesAtual, diaAtual + 1, 4, 59, 59),
            };

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

            const condicoes = { horario: { $gte: inicio, $lt: fim } };

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
                            dia: { $dateToString: { format: "%d-%m-%Y", date: "$horario" } },
                            formaPagamento: "$formaPagamento"
                        },
                        totalVendas: { $sum: "$valorTotal" },
                        quantidadePedidos: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.dia",
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
                    $sort: { "_id": 1 }  // Ordena por data
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