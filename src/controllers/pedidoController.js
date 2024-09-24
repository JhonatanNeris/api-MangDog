import { pedido } from '../models/index.js';

class PedidoController {

    static async getPedidos(req, res, next) {

        try {
            const listaProdutos = await pedido.find({})
            res.status(200).json(listaProdutos)
        } catch (error) {
            next(error);
        }

    }

    static async getPedidosPreparo(req, res, next) {

        try {
            const listaProdutos = await pedido.find({ status: 'em preparo' })
            res.status(200).json(listaProdutos)
        } catch (error) {
            next(error);
        }

    }

    static async getPedidosFiltro(req, res, next) {

        try {
            const { nomeCliente, status } = req.query

            const busca = {}

            if (nomeCliente) busca.nomeCliente = nomeCliente
            if (status) busca.status = status

            const pedidoEncontrado = await pedido.find(busca)

            if (pedidoEncontrado !== null) {
                res.status(200).send(pedidoEncontrado);
            } else {
                next(new NaoEncontrado(`Id do Pedido não localizado!`))
            }

        } catch (error) {
            next(error)
        }

    }

    static async getPedidoId(req, res, next) {

        try {
            const id = req.params.id
            const pedidoEncontrado = await pedido.findById(id)
            res.status(200).json(pedidoEncontrado)
        } catch (error) {
            next(error);
        }

    }

    static async postPedido(req, res, next) {
        try {
            const { nomeCliente, itens, tipoPedido } = req.body;

            let valorTotal = 0;
            let valorAdicionais = 0

            // Processar os itens e calcular o valor total
            const itensProcessados = itens.map((item) => {

                if(item.adicionais.length > 0){
                    item.adicionais.map((adicional) => {
                        adicional.precoTotal = adicional.preco * adicional.quantidade
                        valorAdicionais += adicional.precoTotal
                        item.totalItem = (item.preco + valorAdicionais)
                        return adicional
                    })
                } else {
                    item.totalItem = item.preco
                }

                item.precoTotal = item.totalItem * item.quantidade;
                valorTotal += item.precoTotal;
                return item; // Retornar o item processado
            });

            // Criar o pedido
            const pedidoCompleto = {
                nomeCliente,
                valorTotal,
                tipoPedido,
                itens: itensProcessados
            };

            console.log('PEdido completo',pedidoCompleto)

            // Usar o modelo de pedido para criar o novo pedido
            const pedidoCriado = await pedido.create(pedidoCompleto);

            res.status(201).json({ message: 'Cadastrado com sucesso!', pedido: pedidoCriado });
        } catch (error) {
            next(error);
        }
    }

    static async putPedido(req, res, next) {

        try {
            const id = req.params.id
            await pedido.findByIdAndUpdate(id, req.body)
            res.status(200).json({ message: "Pedido atualizado!" })
        } catch (error) {
            next(error);
        }

    }

    static async deletePedido(req, res, next) {

        try {
            const id = req.params.id
            await pedido.findByIdAndDelete(id)
            res.status(200).json({ message: "Pedido excluído!" })
        } catch (error) {
            // res.status(500).json({ message: `${error.message} - Falha na exclusão do pedido!` });
            next(error);
        }

    }

}

export default PedidoController;