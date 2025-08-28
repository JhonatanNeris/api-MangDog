import { categoria, cliente, produto, configuracoes, pedido, consumidor } from '../models/index.js';

class CardapioDigitalController {

    static async getRestaurante(req, res, next) {

        try {
            const slug = req.params.slug

            // Buscar cliente pelo slug
            const clienteEncontrado = await cliente.findOne({ "loja.slug": slug });

            if (!clienteEncontrado) {
                throw new Error("Cliente não encontrado com esse slug.");
            }

            const clienteId = clienteEncontrado._id;

            const listaCategorias = await categoria.find({ clienteId })

            const listaProdutos = await produto.find({ clienteId }).populate({ path: 'grupoComplementos', populate: { path: 'complementos' } })

            // console.log(listaProdutos)

            // Agrupar produtos por categoria
            const cardapio = listaCategorias.map((cat) => {
                const produtosDaCategoria = listaProdutos.filter(
                    (produto) => produto.categoria._id?.toString() === cat._id.toString()
                );

                return {
                    _id: cat._id,
                    nomeCategoria: cat.nome,
                    produtos: produtosDaCategoria,
                };
            });

            const restaurante = {
                nome: clienteEncontrado.loja.nome,
                logoUrl: clienteEncontrado.loja.logoUrl,
                telefone: clienteEncontrado.loja.telefone,
                slug: clienteEncontrado.loja.slug,
                pedidoMinimo: clienteEncontrado.loja.pedidoMinimo,
                endereco: clienteEncontrado.loja.endereco,
                //Adicioar mais informações depois,

            }

            // 🔹 Buscar configurações vinculadas ao cliente
            const configuracoesCliente = await configuracoes.findOne({ clienteId });

            res.status(200).json({ restaurante, cardapio, configuracoes: configuracoesCliente ?? null })
        } catch (error) {
            next(error);
        }
    }

    static async criarPedido(req, res, next) {
        try {
            const slug = req.params.slug;
            const dadosPedido = req.body;
            const consumidor = req.consumidor

            const clienteEncontrado = await cliente.findOne({ slug });
            if (!clienteEncontrado) {
                return res.status(404).json({ erro: "Restaurante não encontrado." });
            }

            // Buscar configurações e incrementar número do pedido
            const config = await configuracoes.findOneAndUpdate(
                { clienteId: clienteEncontrado._id },
                { $inc: { "pedidos.sequencia": 1 } },
                { new: true }
            );

            const statusCheck = dadosPedido.intencaoPagamento === 'offline' ? "novo" : "pagamento pendente"

            const novoPedido = new pedido({
                ...dadosPedido,
                numeroPedido: config.pedidos.sequencia,
                clienteId: clienteEncontrado._id,
                customerId: consumidor._id,
                origem: 'cardápio-digital',
                status: statusCheck
            });

            await novoPedido.save();

            res.status(201).json(novoPedido);
        } catch (error) {
            next(error);
        }
    }


}

export default CardapioDigitalController;