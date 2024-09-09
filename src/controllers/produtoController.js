import { categoria } from '../models/Categoria.js';
import { produto } from '../models/Produto.js'

class ProdutoController {

    static async getProdutos(req, res) {

        try {
            const listaProdutos = await produto.find({})
            res.status(200).json(listaProdutos)
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição!` });
        }

    }

    static async getProdutoId(req, res) {

        try {
            const id = req.params.id
            const produtoEncontrado = await produto.findById(id)
            res.status(200).json(produtoEncontrado)
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição da produto!` });
        }

    }

    static async postProdutos(req, res) {

        const novoProduto = req.body

        try {
            const categoriaEncontrada = await categoria.findById(novoProduto.categoria)
            const produtoCompleto = { ...novoProduto, categoria: { ...categoriaEncontrada._doc } }

            const produtoCriado = await produto.create(produtoCompleto)
            res.status(201).json({ message: 'Cadastrado com sucesso!', produto: produtoCriado })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha ao cadastrar produto!` });
        }
    }

    static async putProduto(req, res) {

        try {
            const id = req.params.id
            await produto.findByIdAndUpdate(id, req.body)
            res.status(200).json({ message: "Produto atualizado!" })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição do produto!` });
        }

    }

    static async deleteProduto(req, res) {

        try {
            const id = req.params.id
            await produto.findByIdAndDelete(id)
            res.status(200).json({ message: "Produto excluído!" })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na exclusão do produto!` });
        }

    }

}

export default ProdutoController;