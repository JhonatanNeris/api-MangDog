import { pedido } from '../models/index.js';
import NaoEncontrado from "../erros/NaoEncontrado.js";
import RequicicaoIncorreta from '../erros/RequisicaoIncorreta.js';

// Impressora 
import { printText } from '../utils/printerService.js';

//Mongoose
import mongoose from "mongoose";

//Impressora Online
import axios from 'axios'; // Importa o Axios para realizar requisições HTTP
// Função para enviar o pedido para o servidor de impressão local

class PedidoController {

    static async getPedidos(req, res, next) {

        try {
            const listarPedidos = pedido.find({ clienteId: req.usuario.clienteId })

            req.resultado = listarPedidos

            next()

        } catch (error) {
            next(error);
        }

    }

    static async getPedidosDoDia(req, res, next) {
        try {
            const agora = new Date();

            // Começo do dia: hoje às 05:00 da manhã
            const inicioDoDia = new Date(agora);
            inicioDoDia.setHours(5, 0, 0, 0);

            // Se for antes das 5h, o dia "começou" ontem às 5h
            if (agora < inicioDoDia) {
                inicioDoDia.setDate(inicioDoDia.getDate() - 1);
            }

            // Fim do dia: próximo dia às 04:59:59.999
            const fimDoDia = new Date(inicioDoDia);
            fimDoDia.setDate(fimDoDia.getDate() + 1);
            fimDoDia.setHours(4, 59, 59, 999);

            const pedidosDoDia = await pedido.find({
                clienteId: req.usuario.clienteId,
                horario: { $gte: inicioDoDia, $lte: fimDoDia },
            });

            res.status(200).json(pedidosDoDia)
        } catch (error) {
            next(error);
        }
    }


    static async getPedidosPreparo(req, res, next) {

        try {
            console.log(req.usuario)
            const listaProdutos = await pedido.find({ clienteId: req.usuario.clienteId, status: 'em preparo' })
            res.status(200).json(listaProdutos)
        } catch (error) {
            next(error);
        }

    }

    static async getPedidosFiltro(req, res, next) {

        try {
            const { nomeCliente, status, minValorTotal, maxValorTotal, formaPagamento } = req.query

            const busca = {}

            const clienteId = req.usuario.clienteId;

            if (!clienteId) {
                res.status(400).json({ message: 'Cliente ausente ou inválido!' });
            }

            busca.clienteId = clienteId;

            if (nomeCliente) busca.nomeCliente = { $regex: nomeCliente, $options: "i" }
            if (status) busca.status = status
            if (formaPagamento) busca.formaPagamento = formaPagamento

            if (minValorTotal || maxValorTotal) busca.valorTotal = {}

            //GTE = Greater Than or Equal = Maior ou Igual 
            if (minValorTotal) busca.valorTotal.$gte = minValorTotal
            //LTE = Less Than or Equal = Menor ou Igual 
            if (maxValorTotal) busca.valorTotal.$lte = maxValorTotal


            // const pedidoEncontrado = await pedido.find(busca)

            req.resultado = pedido.find(busca)

            next()

            // if (pedidoEncontrado !== null) {

            //     req.resultado = pedidoEncontrado

            //     next()
            //     // res.status(200).send(pedidoEncontrado);
            // } else {
            //     next(new NaoEncontrado(`Id do Pedido não localizado!`))
            // }

        } catch (error) {
            next(error)
        }

    }

    static async getPedidoId(req, res, next) {
        try {
            const id = req.params.id
            const pedidoEncontrado = await pedido.findOne({
                _id: id,
                clienteId: req.usuario.clienteId
            })
            .populate({
                path: 'itens.grupoComplementos',
                populate: {
                    path: 'complementos'
                }
            });


            if (pedidoEncontrado !== null) {
                res.status(200).json(pedidoEncontrado)
            } else {
                next(new NaoEncontrado(`Id do pedido não localizado!`))
            }
        } catch (error) {
            next(error);
        }

    }

    static async postPedido(req, res, next) {
        try {
            const { nomeCliente, itens, tipoPedido, formaPagamento, desconto, pagamentos } = req.body;

            let valorTotal = 0;
            let descontoAplicado = parseFloat(desconto) || 0; // Garante que é um número válido
            let subtotal = 0

            // Processar os itens e calcular o valor total
            const itensProcessados = itens.map((item) => {
                let valorComplementos = 0;

                if (item.complementos && item.complementos.length > 0) {
                    item.complementos = item.complementos.map((complemento) => {
                        complemento.precoTotal = complemento.preco * complemento.quantidade;
                        valorComplementos += complemento.precoTotal;
                        return complemento;
                    });

                    item.totalItem = (item.preco + valorComplementos);
                } else {
                    item.totalItem = item.preco;
                }

                item.precoTotal = item.totalItem * item.quantidade;
                subtotal += item.precoTotal;
                return item;
            });

            // Aplicar desconto e calcular valor total
            valorTotal = Math.max(0, subtotal - descontoAplicado); // Evita valores negativos

            // Soma de todos os pagamentos enviados
            const valorPago = (pagamentos || []).reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0);

            const valorFiado = valorTotal - valorPago;

            console.log(subtotal, valorTotal)

            // Criar o pedido com o clienteId convertido
            const pedidoCompleto = {
                nomeCliente,
                subtotal,
                valorTotal,
                desconto: descontoAplicado,
                tipoPedido,
                formaPagamento,
                pagamentos,
                valorPago,
                valorFiado,
                itens: itensProcessados,
                clienteId: req.usuario.clienteId, // Aqui você usa o clienteId convertido
            };

            console.log('Novo pedido:', pedidoCompleto.itens);

            // Usar o modelo de pedido para criar o novo pedido
            const pedidoCriado = await pedido.create(pedidoCompleto);

            if (!pedidoCriado) {
                return res.status(500).json({ message: 'Erro ao criar o pedido no banco de dados.' });
            }

            res.status(201).json({ message: 'Pedido criado com sucesso!', pedido: pedidoCriado });
        } catch (error) {
            console.error("Erro ao criar pedido:", error);
            next(error);
        }
    }


    static async putPedido(req, res, next) {

        try {
            const id = req.params.id
            const pedidoEncontrado = await pedido.findOneAndUpdate({ _id: id, clienteId: req.usuario.clienteId }, req.body, { new: true })

            if (pedidoEncontrado !== null) {
                res.status(200).json(pedidoEncontrado)
            } else {
                next(new NaoEncontrado('Id do pedido não localizado'))
            }
        } catch (error) {
            next(error);
        }

    }

    static async putPedidoItem(req, res, next) {

        try {
            const { pedidoId, itemId } = req.params;
            const { status } = req.body;

            console.log("Atualizar item", pedidoId, itemId, status)

            const order = await pedido.findById(pedidoId);
            console.log("Pedido encontrado", order)
            if (!order) return res.status(404).json({ message: "Pedido não encontrado" });

            const item = order.itens.find(i => i.idItem.toString() === itemId);
            console.log("Item encontrado", item)
            if (!item) return res.status(404).json({ message: "Item não encontrado" });

            item.status = status; // Atualiza o status do item
            await order.save(); // Salva as alterações

            res.status(200).json({ message: "Pedido atualizado!" })
        } catch (error) {
            next(error);
        }

    }

    static async deletePedido(req, res, next) {

        try {
            const id = req.params.id
            const pedidoApagado = await pedido.findOneAndDelete({
                _id: id,
                clienteId: req.usuario.clienteId
            })

            if (pedidoApagado !== null) {
                res.status(200).json({ message: "Pedido excluído!" })
            } else {
                next(new NaoEncontrado('Id do pedido não localizado'))
            }
        } catch (error) {
            // res.status(500).json({ message: `${error.message} - Falha na exclusão do pedido!` });
            next(error);
        }

    }

}

export default PedidoController;
