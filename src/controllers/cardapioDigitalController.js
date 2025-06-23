import { categoria, cliente, produto } from '../models/index.js';


class CardapioDigitalController {

    static async getRestaurante(req, res, next) {

        try {
            const slug = req.params.slug

            // Buscar cliente pelo slug
            const clienteEncontrado = await cliente.findOne({ slug });

            if (!clienteEncontrado) {
                throw new Error("Cliente não encontrado com esse slug.");
            }

            const clienteId = clienteEncontrado._id;

            const listaCategorias = await categoria.find({ clienteId })

            const listaProdutos = await produto.find({ clienteId }).populate({ path: 'grupoComplementos', populate: { path: 'complementos' } })

            console.log(listaProdutos)

            // Agrupar produtos por categoria
            const cardapio = listaCategorias.map((cat) => {
                const produtosDaCategoria = listaProdutos.filter(
                    (produto) => produto.categoria._id?.toString() === cat._id.toString()
                );

                return {
                    _id: cat._id,
                    nome: cat.nome,
                    produtos: produtosDaCategoria,
                };
            });

            const restaurante = {
                nome: clienteEncontrado.nome,
                logoUrl: clienteEncontrado.logoUrl,
                telefone: clienteEncontrado.telefoneContato,
                slug: clienteEncontrado.slug,
                //Adicioar mais informações depois,

            }

            res.status(200).json({restaurante, cardapio})
        } catch (error) {
            next(error);
        }



    }


}

export default CardapioDigitalController;