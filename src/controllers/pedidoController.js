import { categoria } from '../models/Categoria.js';
import pedido from '../models/Pedido.js';
import { produto } from '../models/Produto.js'

class PedidoController {

    static async getPedidos(req, res) {

        try {
            const listaProdutos = await pedido.find({})
            res.status(200).json(listaProdutos)
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição!` });
        }

    }

    static async getPedidosPreparo(req, res) {

        try {
            const listaProdutos = await pedido.find({status: 'em preparo'})
            res.status(200).json(listaProdutos)
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição!` });
        }

    }

    static async getPedidoId(req, res) {

        try {
            const id = req.params.id
            const pedidoEncontrado = await pedido.findById(id)
            res.status(200).json(pedidoEncontrado)
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição da pedido!` });
        }

    }

    static async postPedido(req, res) {
        try {
            const { nomeCliente, itens, tipoPedido } = req.body;

            let valorTotal = 0;
            let valorAdicionais = 0

            // Processar os itens e calcular o valor total
            const itensProcessados = itens.map((item) => {
                item.adicionais.map((adicional) => {
                    adicional.precoTotal = adicional.preco * adicional.quantidade
                    valorAdicionais += adicional.precoTotal
                    item.totalItem = (item.preco + valorAdicionais)
                    return adicional
                })
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

            console.log(pedidoCompleto)

            // Usar o modelo de pedido para criar o novo pedido
            const pedidoCriado = await pedido.create(pedidoCompleto);

            res.status(201).json({ message: 'Cadastrado com sucesso!', pedido: pedidoCriado });
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha ao cadastrar pedido!` });
        }
    }

    static async putPedido(req, res) {

        try {
            const id = req.params.id
            await pedido.findByIdAndUpdate(id, req.body)
            res.status(200).json({ message: "Pedido atualizado!" })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição do pedido!` });
        }

    }

    static async deletePedido(req, res) {

        try {
            const id = req.params.id
            await pedido.findByIdAndDelete(id)
            res.status(200).json({ message: "Pedido excluído!" })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na exclusão do pedido!` });
        }

    }

}

export default PedidoController;