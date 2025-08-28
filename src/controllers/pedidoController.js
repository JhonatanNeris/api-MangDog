import { pedido, configuracoes, produto } from '../models/index.js';
import NaoEncontrado from "../erros/NaoEncontrado.js";
import RequisicaoIncorreta from '../erros/RequisicaoIncorreta.js';

// Impressora 
import { printText } from '../utils/printerService.js';

//Mongoose
import mongoose from "mongoose";

//Impressora Online
import axios from 'axios'; // Importa o Axios para realizar requisições HTTP

//REMOVENDO SOCKET
// import { getIO } from '../../socket.js';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
});

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
                createdAt: { $gte: inicioDoDia, $lte: fimDoDia },
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
            const { nomeCliente, status, minValorTotal, maxValorTotal, formaPagamento, apenasEmAberto } = req.query

            const busca = {}

            const clienteId = req.usuario.clienteId;

            if (!clienteId) {
                res.status(400).json({ message: 'Cliente ausente ou inválido!' });
            }

            busca.clienteId = clienteId;

            if (nomeCliente) busca.nomeCliente = { $regex: nomeCliente, $options: "i" }
            if (status) busca.status = status
            if (formaPagamento) busca.formaPagamento = formaPagamento
            if (apenasEmAberto === 'true') busca.valorFiado = { $gt: 0 }; // 👈 aqui o filtro por fiado


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
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { customerId, nomeCliente, tipoPedido, formaPagamento, desconto, pagamentos, itens, delivery } = req.body;
            const clienteId = req.usuario.clienteId;
            if (!clienteId) {
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({ message: 'inválido' });
            }
            const configAtualizada = await configuracoes.findOneAndUpdate(
                { clienteId },
                { $inc: { "pedidos.sequencia": 1 } },
                { new: true, session }
            );
            if (!configAtualizada) {
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({ erro: "Configuração não encontrada." });
            }
            const numeroPedido = configAtualizada.pedidos.sequencia;
            let valorTotal = 0;
            let descontoAplicado = parseFloat(desconto) || 0;
            let subtotal = 0;
            const itensProcessados = [];
            for (const item of itens) {
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
                itensProcessados.push(item);
                const produtoDb = await produto.findOne({ _id: item._id, clienteId }).session(session);
                if (!produtoDb) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ message: 'Produto não encontrado' });
                }
                if (produtoDb.controlaEstoque) {
                    const atualizado = await produto.findOneAndUpdate(
                        { _id: item._id, clienteId, quantidadeEstoque: { $gte: item.quantidade } },
                        { $inc: { quantidadeEstoque: -item.quantidade } },
                        { new: true, session }
                    );
                    if (!atualizado) {
                        await session.abortTransaction();
                        session.endSession();
                        return res.status(400).json({ message: `Estoque insuficiente para o produto ${produtoDb.nome}` });
                    }
                }
            }
            if (tipoPedido === 'delivery' && delivery) {
                if (!delivery.deliveryAreaId) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: 'Área de entrega não selecionada.' });
                }
                if (!delivery.deliveryAddress || !delivery.deliveryAddress.streetName || !delivery.deliveryAddress.neighborhood) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: 'Endereço de entrega incompleto, preencha bairo e logradouro' });
                }
                if (delivery.deliveryFee === undefined || delivery.deliveryFee < 0) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: 'Taxa de entrega inválida.' });
                }
            } else if (tipoPedido === 'delivery') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: 'Informações de entrega ausentes.' });
            }
            const deliveryFee = (tipoPedido === 'delivery') ? Number(delivery?.deliveryFee || 0) : 0;
            const totalComFrete = subtotal + deliveryFee;
            valorTotal = Math.max(0, (totalComFrete - descontoAplicado));
            const valorPago = (pagamentos || []).reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0);
            const valorFiado = valorTotal - valorPago;
            console.log(subtotal, valorTotal);
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
                clienteId: req.usuario.clienteId,
                numeroPedido,
                delivery,
                eventos: [{ tipo: 'pedido criado', usuario: req.usuario?.nome, horario: new Date() }]
            };
            console.log('Novo pedido:', pedidoCompleto.itens);
            const pedidoCriadoArr = await pedido.create([pedidoCompleto], { session });
            if (!pedidoCriadoArr || !pedidoCriadoArr[0]) {
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({ message: 'Erro ao criar o pedido no banco de dados.' });
            }
            await session.commitTransaction();
            res.status(201).json({ message: 'Pedido criado com sucesso!', pedido: pedidoCriadoArr[0] });
        } catch (error) {
            await session.abortTransaction();
            console.error('Erro ao criar pedido:', error);
            next(error);
        } finally {
            session.endSession();
        }
    }


    static async putPedido(req, res, next) {

        try {
            const id = req.params.id
            const updateData = { $set: req.body, $push: { eventos: { tipo: 'pedido editado', usuario: req.usuario?.nome, horario: new Date() } } };
            const pedidoEncontrado = await pedido.findOneAndUpdate({ _id: id, clienteId: req.usuario.clienteId }, updateData, { new: true })

            //REMOVENDO SOCKET
            // const io = getIO();
            // io.to(req.usuario.clienteId).emit("pedido:atualizado", pedidoEncontrado);

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

    static async marcarPedidoPronto(req, res, next) {
        try {
            const id = req.params.id;
            const pedidoAtualizado = await pedido.findOneAndUpdate(
                { _id: id, clienteId: req.usuario.clienteId },
                {
                    $set: { status: 'pronto' },
                    $push: {
                        eventos: {
                            tipo: 'pedido marcado como pronto',
                            usuario: req.usuario?.nome,
                            horario: new Date()
                        }
                    }
                },
                { new: true }
            );

            if (!pedidoAtualizado) {
                return res.status(404).json({ message: "Pedido não encontrado" });
            }

            res.status(200).json(pedidoAtualizado);
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

            //REMOVENDO SOCKET
            // const io = getIO();
            // io.to(req.usuario.clienteId).emit("pedido:removido", pedidoApagado);

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

    static async cancelarPedido(req, res, next) {
        try {

            console.log("cancelando")
            const pedidoEncontrado = await pedido.findById(req.params.id);

            console.log(pedidoEncontrado)



            if (!pedidoEncontrado) return res.status(404).json({ erro: 'Pedido não encontrado.' });
            if (pedidoEncontrado.status === 'cancelado') return res.status(400).json({ erro: 'Pedido já cancelado.' });

            if (pedidoEncontrado.paymentIntentId) {
                console.log("reembolsar", pedidoEncontrado._id)
                // Reembolsar
                await stripe.refunds.create({
                    payment_intent: pedidoEncontrado.paymentIntentId,
                });
            }

            pedidoEncontrado.status = 'cancelado';
            pedidoEncontrado.eventos.push({
                tipo: 'pedido cancelado',
                usuario: req.usuario?.nome,
                horario: new Date()
            });
            // pedido.reembolsado = !!pedido.paymentIntentId;
            await pedidoEncontrado.save();

            res.status(200).json({ ok: true, pedidoCancelado: pedidoEncontrado });
        } catch (error) {

        }

    }

}

export default PedidoController;
